fx_version 'cerulean'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

author 'EvilShatner'
description 'An immersive notebook that allows full texture rich editing, picture embeddment, and saving of pages to give to another player'
version '1.0.0'

client_scripts {
    'client.lua'
}

server_scripts {
    'server.lua'
}

ui_page 'ui/index.html'

files {
    'ui/index.html',
    'ui/script.js',
    'ui/style.css',
    'ui/book_background.png'
}

dependencies {
    'vorp_core',
    'vorp_inventory'
}

lua54 'yes'