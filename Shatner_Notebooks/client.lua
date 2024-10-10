local VORPcore = {}
local isNotebookOpen = false
local currentCharId = nil

-- Initialize VORPcore
Citizen.CreateThread(function()
    while VORPcore.getChar == nil do
        TriggerEvent("getCore", function(core)
            VORPcore = core
        end)
        Citizen.Wait(200)
    end
end)

-- Function to get character ID
local function GetCharacterId()
    local _source = source
    local Character = VORPcore.getUser(_source).getUsedCharacter
    return Character.charIdentifier
end

-- Open notebook event
RegisterNetEvent("Shatner_Notebooks:openNotebook")
AddEventHandler("Shatner_Notebooks:openNotebook", function()
    if not isNotebookOpen then
        isNotebookOpen = true
        currentCharId = GetCharacterId()
        if currentCharId then
            TriggerServerEvent("Shatner_Notebooks:loadData", currentCharId)
            SetNuiFocus(true, true)
            SendNUIMessage({
                type = "openNotebook"
            })
        else
            print("Error: Unable to get character ID")
        end
    end
end)

-- Close notebook callback
RegisterNUICallback("closeNotebook", function(data, cb)
    if isNotebookOpen then
        isNotebookOpen = false
        SetNuiFocus(false, false)
        currentCharId = nil
        cb({})
    end
end)

-- Save notebook callback
RegisterNUICallback("saveNotebook", function(data, cb)
    if currentCharId then
        TriggerServerEvent("Shatner_Notebooks:saveData", currentCharId, data)
        cb({success = true})
    else
        print("Error: No character ID available for saving")
        cb({success = false, error = "No character ID available"})
    end
end)

-- Save response event
RegisterNetEvent("Shatner_Notebooks:saveResponse")
AddEventHandler("Shatner_Notebooks:saveResponse", function(success)
    SendNUIMessage({
        type = "saveNotebookResponse",
        success = success
    })
end)

-- Load response event
RegisterNetEvent("Shatner_Notebooks:loadResponse")
AddEventHandler("Shatner_Notebooks:loadResponse", function(notebookData)
    SendNUIMessage({
        type = "openNotebook",
        data = notebookData
    })
end)

-- Turn page callback
RegisterNUICallback("turnPage", function(data, cb)
    -- Add any additional logic for page turning if needed
    cb({})
end)

-- Error handling
AddEventHandler('onClientResourceStart', function(resourceName)
    if(GetCurrentResourceName() ~= resourceName) then
        return
    end
    print('The resource ' .. resourceName .. ' has been started on the client.')
end)

AddEventHandler('onResourceStop', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then
        return
    end
    if isNotebookOpen then
        SetNuiFocus(false, false)
        isNotebookOpen = false
    end
    print('The resource ' .. resourceName .. ' has been stopped on the client.')
end)

-- Debug command to open notebook (remove in production)
RegisterCommand("opennb", function(source, args, rawCommand)
    TriggerEvent("Shatner_Notebooks:openNotebook")
end, false)