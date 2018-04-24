export const SCRIPT_LIST_REQUEST = 'SCRIPT_LIST_REQUEST'
export const SCRIPT_LIST_SUCCESS = 'SCRIPT_LIST_SUCCESS'
export const SCRIPT_LIST_FAILURE = 'SCRIPT_LIST_FAILURE'

export const BUFFER_READ_REQUEST = 'BUFFER_READ_REQUEST'
export const BUFFER_READ_SUCCESS = 'BUFFER_READ_SUCCESS'
export const BUFFER_READ_FAILURE = 'BUFFER_READ_FAILURE'

export const DIRECTORY_READ_REQUEST = 'DIRECTORY_READ_REQUEST'
export const DIRECTORY_READ_SUCCESS = 'DIRECTORY_READ_SUCCESS'
export const DIRECTORY_READ_FAILURE = 'DIRECTORY_READ_FAILURE'

export const BUFFER_CHANGE = 'BUFFER_CHANGE'

export const BUFFER_SAVE_REQUEST = 'BUFFER_SAVE_REQUEST'
export const BUFFER_SAVE_SUCCESS = 'BUFFER_SAVE_SUCCESS'
export const BUFFER_SAVE_FAILURE = 'BUFFER_SAVE_FAILURE'

export const BUFFER_SELECT = 'BUFFER_SELECT'
export const SCRIPT_NEW = 'SCRIPT_NEW'
export const SCRIPT_DUPLICATE = 'SCRIPT_DUPLICATE'

export const RESOURCE_RENAME_REQUEST = 'RESOURCE_RENAME_REQUEST'
export const RESOURCE_RENAME_SUCCESS = 'RESOURCE_RENAME_SUCCESS'
export const RESOURCE_RENAME_FAILURE = 'RESOURCE_RENAME_FAILURE'

export const RESOURCE_DELETE_REQUEST = 'RESOURCE_DELETE_REQUEST'
export const RESOURCE_DELETE_SUCCESS = 'RESOURCE_DELETE_SUCCESS'
export const RESOURCE_DELETE_FAILURE = 'RESOURCE_DELETE_FAILURE'

export const DIRECTORY_CREATE_REQUEST = 'DIRECTORY_CREATE_REQUEST'
export const DIRECTORY_CREATE_SUCCESS = 'DIRECTORY_CREATE_SUCCESS'
export const DIRECTORY_CREATE_FAILURE = 'DIRECTORY_CREATE_FAILURE'

export const TOOL_INVOKE = 'TOOL_INVOKE'

export const EXPLORER_TOGGLE_NODE = 'EXPLORER_TOGGLE_NODE'
export const EXPLORER_ACTIVE_NODE = 'EXPLORER_ACTIVE_NODE'

//
// sync actions
//

export const scriptListRequest = () => {
    return { type: SCRIPT_LIST_REQUEST }
}

export const scriptListSuccess = (value) => {
    return { type: SCRIPT_LIST_SUCCESS, value }
}

export const scriptListFailure = (error) => {
    return { type: SCRIPT_LIST_FAILURE, error }
}

export const bufferReadRequest = (resource) => {
    return { type: BUFFER_READ_REQUEST, resource }
}

export const bufferReadSuccess = (resource, value) => {
    return { type: BUFFER_READ_SUCCESS, resource, value }
}

export const bufferReadFailure = (resource, error) => {
    return { type: BUFFER_READ_FAILURE, resource, error }
}

export const directoryReadRequest = (resource) => {
    return { type: DIRECTORY_READ_REQUEST, resource }
}

export const directoryReadSuccess = (resource, value) => {
    return { type: DIRECTORY_READ_SUCCESS, resource, value }
}

export const directoryReadFailure = (resource, error) => {
    return { type: DIRECTORY_READ_FAILURE, resource, error }
}

export const bufferSaveRequest = (resource, value) => {
    return { type: BUFFER_SAVE_REQUEST, resource, value }
}

export const bufferSaveSuccess = (resource, value) => {
    return { type: BUFFER_SAVE_SUCCESS, resource, value }
}

export const bufferSaveFailure = (resource, error) => {
    return { type: BUFFER_SAVE_FAILURE, resource, error }
}

export const bufferChange = (resource, value) => {
    return { type: BUFFER_CHANGE, resource, value }
}

export const bufferSelect = (resource) => {
    return { type: BUFFER_SELECT, resource }
}

export const scriptNew = (siblingResource, value, name) => {
    return { type: SCRIPT_NEW, siblingResource, value, name }
}

export const scriptDuplicate = (resource) => {
    return { type: SCRIPT_DUPLICATE, resource }
}

export const resourceRenameRequest = (resource, name) => {
    return { type: RESOURCE_RENAME_REQUEST, resource, name }
}

export const resourceRenameSuccess = (resource, newName, newResource) => {
    return { type: RESOURCE_RENAME_SUCCESS, resource, newName, newResource }
}

export const resourceRenameFailure = (resource, name, error) => {
    return { type: RESOURCE_RENAME_FAILURE, resource, name, error }
}

export const directoryCreateRequest = (siblingResource, name) => {
    return { type: DIRECTORY_CREATE_REQUEST, siblingResource, name }
}

export const directoryCreateSuccess = (resource) => {
    return { type: DIRECTORY_CREATE_SUCCESS, resource }
}

export const directoryCreateFailure = (resource, error) => {
    return { type: DIRECTORY_CREATE_FAILURE, resource, error }
}

export const resourceDeleteRequest = (resource) => {
    return { type: RESOURCE_DELETE_REQUEST, resource }
}

export const resourceDeleteSuccess = (resource) => {
    return { type: RESOURCE_DELETE_SUCCESS, resource }
}

export const resourceDeleteFailure = (resource, error) => {
    return { type: RESOURCE_DELETE_FAILURE, resource, error }
}


export const toolInvoke = (name) => {
    return { type: TOOL_INVOKE, name }
}

export const explorerActiveNode = (node) => {
    return { type: EXPLORER_ACTIVE_NODE, node }
}

export const explorerToggleNode = (node, toggled) => {
    return { type: EXPLORER_TOGGLE_NODE, node, toggled }
}

//
// async actions
//

export const scriptList = (api) => {
    return (dispatch) => {
        dispatch(scriptListRequest());
        return api.listScripts((response) => {
            if (response.ok) {
                response.json().then(data => {
                    dispatch(scriptListSuccess(data))
                })
            } else {
                dispatch(scriptListFailure())
            }
        })
    }
}

export const bufferRead = (api, resource) => {
    return (dispatch) => {
        dispatch(bufferReadRequest(resource))
        fetch(resource).then((response) => {
            if (response.ok) {
                response.text().then(content => {
                    dispatch(bufferReadSuccess(resource, content));
                })
            } else {
                dispatch(bufferReadFailure(resource));
            }
        }).catch(error => {
            dispatch(bufferReadFailure(resource, error));
        })
    }
}

export const directoryRead = (api, resource) => {
    return (dispatch) => {
        dispatch(directoryReadRequest(resource))
        fetch(resource).then(response => {
            if (response.ok) {
                response.json().then(data => {
                    dispatch(directoryReadSuccess(resource, data));
                })
            } else {
                dispatch(directoryReadFailure(resource));
            }
        })
        .catch(error => {
            dispatch(directoryReadFailure(resource, error));
        })
    }
}

export const bufferSave = (api, resource, value, cb) => {
    return (dispatch) => {
        dispatch(bufferSaveRequest(resource, value))
        return api.writeTextResource(resource, value, (response) => {
            // FIXME: handle errors
            dispatch(bufferSaveSuccess(resource, response.entity))
            cb && cb()
        })
    }
}

export const resourceDelete = (api, resource, cb) => {
    return (dispatch) => {
        dispatch(resourceDeleteRequest(resource))
        return api.deleteResource(resource, (response) => {
            // FIXME: handle errors
            dispatch(resourceDeleteSuccess(resource, response.entity))
            cb && cb()
        })
    }
}

export const resourceRename = (api, resource, name, virtual) => {
    return (dispatch) => {
        dispatch(resourceRenameRequest(resource, name));
        if (virtual) {
            dispatch(resourceRenameSuccess(resource, name, undefined))
        } else {
            api.renameResource(resource, name, (response) => {
                if (response.ok) {
                    response.json().then(data => {
                        dispatch(resourceRenameSuccess(resource, name, data.url));
                    });
                } else {
                    dispatch(resourceRenameFailure(resource, name, undefined));
                }
            })
        }
    }
}

export const directoryCreate = (api, sibling, name, cb) => {
    return (dispatch) => {
        dispatch(directoryCreateRequest(sibling, name))
        // this is wrong
        return api.createFolder(sibling, name, (response) => {
            // handle errors?
            dispatch(directoryCreateSuccess(response.entity))
            cb && cb()
        })
    }
}
