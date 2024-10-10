local VORPcore = {}
local VORPinv = {}

-- Initialize VORPcore and VORPinv
TriggerEvent("getCore", function(core)
    VORPcore = core
end)

VORPinv = exports.vorp_inventory:vorp_inventoryApi()

-- Database initialization
Citizen.CreateThread(function()
    exports.ghmattimysql:execute([[
        CREATE TABLE IF NOT EXISTS notebooks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            character_id INT,
            notebook_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ]])
    print("Shatner_Notebooks: Database table initialized")
end)

-- Open notebook from inventory
VORPinv.RegisterUsableItem("torn_page", function(data)
    local _source = data.source
    local Character = VORPcore.getUser(_source).getUsedCharacter
    local charId = Character.charIdentifier

    TriggerClientEvent("Shatner_Notebooks:openNotebook", _source, charId)
    print("Shatner_Notebooks: Opened notebook for character ID " .. charId)
end)

-- Save notebook data
RegisterServerEvent("Shatner_Notebooks:saveData")
AddEventHandler("Shatner_Notebooks:saveData", function(charId, notebookData)
    local _source = source
    local encodedData = json.encode(notebookData)

    exports.ghmattimysql:execute("INSERT INTO notebooks (character_id, notebook_data) VALUES (@charId, @data) ON DUPLICATE KEY UPDATE notebook_data = @data", {
        ['@charId'] = charId,
        ['@data'] = encodedData
    }, function(result)
        if result.affectedRows > 0 then
            TriggerClientEvent("Shatner_Notebooks:saveResponse", _source, true)
            print("Shatner_Notebooks: Saved notebook data for character ID " .. charId)
        else
            TriggerClientEvent("Shatner_Notebooks:saveResponse", _source, false)
            print("Shatner_Notebooks: Failed to save notebook data for character ID " .. charId)
        end
    end)
end)

-- Load notebook data
RegisterServerEvent("Shatner_Notebooks:loadData")
AddEventHandler("Shatner_Notebooks:loadData", function(charId)
    local _source = source

    exports.ghmattimysql:execute("SELECT notebook_data FROM notebooks WHERE character_id = @charId", {
        ['@charId'] = charId
    }, function(result)
        if result[1] then
            local decodedData = json.decode(result[1].notebook_data)
            TriggerClientEvent("Shatner_Notebooks:loadResponse", _source, decodedData)
            print("Shatner_Notebooks: Loaded notebook data for character ID " .. charId)
        else
            TriggerClientEvent("Shatner_Notebooks:loadResponse", _source, nil)
            print("Shatner_Notebooks: No notebook data found for character ID " .. charId)
        end
    end)
end)

-- Debug command to add torn_page item (remove in production)
RegisterCommand("givenb", function(source, args, rawCommand)
    local _source = source
    local itemName = "torn_page"
    local quantity = 1

    VORPinv.addItem(_source, itemName, quantity)
    print("Shatner_Notebooks: Added torn_page item to player inventory")
end, false)

-- Error handling and logging
AddEventHandler('onResourceStart', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then
        return
    end
    print('The resource ' .. resourceName .. ' has been started on the server.')
end)

AddEventHandler('onResourceStop', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then
        return
    end
    print('The resource ' .. resourceName .. ' has been stopped on the server.')
end)