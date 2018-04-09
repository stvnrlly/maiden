package main

import (
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/url"
	"os"
	"path/filepath"

	"github.com/kataras/iris"
	"github.com/kataras/iris/middleware/logger"
	"github.com/kataras/iris/middleware/recover"
)

var (
	version = "0.0.1"
)

const (
	SCRIPT_DIR = "lua"
	AUDIO_DIR  = "audio"
	DATA_DIR   = "data"
	SCLANG_DIR = "sc"
)

func main() {
	var port = flag.Int("port", 5000, "http port")
	var dataDir = flag.String("data", "data/", "path to user data directory")
	var siteDir = flag.String("site", "site/", "path to static site directory")
	var debug = flag.Bool("debug", false, "enable debug logging")

	flag.Parse()

	// FIXME: pull in git version
	log.Printf("maiden (%s)", version)
	log.Printf("  port: %d", *port)
	log.Printf("  site: %s", *siteDir)
	log.Printf("  data: %s", *dataDir)

	app := iris.New()

	if *debug {
		app.Logger().SetLevel("debug")
	}
	// add two built'n handlers
	// that can recover from any http-relative panics
	// and log the requests to the terminal.
	app.Use(recover.New())
	app.Use(logger.New())

	// expose site
	app.StaticWeb("/", *siteDir)

	// api
	apiRoot := "/api/v1"
	resourcePath := makeResourcePath(filepath.Join(apiRoot, "scripts"))
	api := app.Party(apiRoot)
	api.Get("/", func(ctx iris.Context) {
		ctx.JSON(apiInfo{"maiden", version})
	})

	api.Get("/scripts", func(ctx iris.Context) {
		entries, err := ioutil.ReadDir(filepath.Join(*dataDir, SCRIPT_DIR))
		if err != nil {
			ctx.StatusCode(iris.StatusBadRequest)
			return
		}

		dir := handleDirRead("", &entries, resourcePath)
		ctx.JSON(dir)
	})

	api.Get("/scripts/{name:path}", func(ctx iris.Context) {
		name := ctx.Params().Get("name")
		path := scriptPath(dataDir, &name)

		// figure out if this is a file or not
		info, err := os.Stat(path)
		if err != nil {
			ctx.Values().Set("message", err.Error())
			ctx.StatusCode(iris.StatusNotFound)
			return
		}

		if info.IsDir() {
			entries, err := ioutil.ReadDir(path)
			if err != nil {
				// not sure why this would fail given that we just stat()'d the dir
				ctx.Values().Set("message", err.Error())
				ctx.StatusCode(iris.StatusBadRequest)
				return
			}

			prefix := filepath.Join(apiRoot, "scripts", name)
			subResourcePath := makeResourcePath(prefix)
			dir := handleDirRead(name, &entries, subResourcePath)
			ctx.JSON(dir)
			return
		}

		ctx.ContentType("text/utf-8") // FIXME: is this needed? is it bad?
		err = ctx.ServeFile(path, false)
		if err != nil {
			ctx.NotFound()
		}
	})

	api.Put("/scripts/{name:path}", func(ctx iris.Context) {
		name := ctx.Params().Get("name")
		path := scriptPath(dataDir, &name)

		// get code (file) blob
		file, _, err := ctx.FormFile("value")
		if err != nil {
			ctx.StatusCode(iris.StatusBadRequest)
			ctx.Values().Set("message", err.Error())
			return
		}

		app.Logger().Debug("save path: ", path)
		app.Logger().Debug("content type: ", ctx.GetContentType())

		// open destination stream
		out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0666)
		defer out.Close()

		if err != nil {
			ctx.StatusCode(iris.StatusInternalServerError)
			ctx.Values().Set("message", err.Error())
			return
		}

		size, err := io.Copy(out, file)
		if err != nil {
			ctx.StatusCode(iris.StatusInternalServerError)
			ctx.Values().Set("message", err.Error())
			return
		}
		app.Logger().Debugf("wrote %d bytes to %s", size, path)
	})

	api.Patch("/scripts/{name:path}", func(ctx iris.Context) {
		// FIXME: this logic basically assumes PATCH == rename operation at the moment
		name := ctx.Params().Get("name")
		path := scriptPath(dataDir, &name)

		// figure out if this exists or not
		_, err := os.Stat(path)
		if err != nil {
			ctx.Values().Set("message", err.Error())
			ctx.NotFound()
			return
		}

		// compute new path
		rename := filepath.Join(filepath.Dir(name), ctx.PostValue("name"))
		renamePath := scriptPath(dataDir, &rename)

		app.Logger().Debug("going to rename: ", path, " to: ", renamePath)

		err = os.Rename(path, renamePath)
		if err != nil {
			ctx.Values().Set("message", err.Error())
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		ctx.JSON(patchInfo{resourcePath(rename)})

	})

	api.Delete("/scripts/{name:path}", func(ctx iris.Context) {
		name := ctx.Params().Get("name")
		path := scriptPath(dataDir, &name)

		app.Logger().Debug("going to delete: ", path)

		// issue 404 if it doesn't exist
		if _, err := os.Stat(path); os.IsNotExist(err) {
			ctx.Values().Set("message", err.Error())
			ctx.NotFound()
			return
		}

		err := os.Remove(path)
		if err != nil {
			ctx.StatusCode(iris.StatusInternalServerError)
			ctx.Values().Set("message", err.Error())
			return
		}
	})

	app.Run(iris.Addr(fmt.Sprintf(":%d", *port)), iris.WithoutVersionChecker)
}

func scriptPath(dataDir *string, name *string) string {
	return filepath.Join(*dataDir, SCRIPT_DIR, *name)
}

type prefixFunc func(...string) string

func makeResourcePath(prefix string) prefixFunc {
	return func(parts ...string) string {
		var escaped = []string{}
		for _, part := range parts {
			escaped = append(escaped, url.PathEscape(part))
		}
		return filepath.Join(prefix, filepath.Join(escaped...))
	}
}

type apiInfo struct {
	API     string `json:"api"`
	Version string `json:"version"`
}

type scriptInfo struct {
	Name     string        `json:"name"`
	URL      string        `json:"url"`
	Children *[]scriptInfo `json:"children,omitempty"`
}

type dirInfo struct {
	Path    string       `json:"path"`
	Entries []scriptInfo `json:"entries"`
}

type errorInfo struct {
	Error string `json:"error"`
}

type patchInfo struct {
	URL string `json:"url"`
}

func handleDirRead(path string, entries *[]os.FileInfo, resourcePath prefixFunc) *dirInfo {
	var scripts = []scriptInfo{}
	for _, entry := range *entries {
		var children *[]scriptInfo
		if entry.IsDir() {
			children = &[]scriptInfo{}
		}
		scripts = append(scripts, scriptInfo{
			entry.Name(),
			resourcePath(entry.Name()),
			children,
		})
	}
	return &dirInfo{
		path,
		scripts,
	}
}
