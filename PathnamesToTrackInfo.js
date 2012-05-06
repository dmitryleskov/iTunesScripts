//
// FixNames.js - Propagate file names to metadata
//
// Version: 0.1
//
// Refer to the file COPYING.MIT for licensing conditions.
//
// Copyright (c) 2011, Dmitry Leskov. All rights reserved.
//

function debug(s) {
    if (debug) WScript.Echo(s)
}

function log(s) {
    if (verbose) WScript.Echo(s)
}

function warning(s) {
    WScript.Echo('WARNING: '+s)
}

var verbose = true
var debug = false
var dryRun = false
WScript.Interactive = true

var WSH = new ActiveXObject("WScript.Shell")
var fso = new ActiveXObject("Scripting.FileSystemObject")

var homeFolder  = fso.GetFile(WScript.ScriptFullName).ParentFolder

try {
    var args = WScript.Arguments
    for (var i = 0; i < args.length; i++) {
        switch (args(i)) {
        case "-show":
            var showIndex = args(++i)
            break
        case "-season":
            var seasonIndex = args(++i)
            break
        case "-episode":
            var episodeIndex = args(++i)
            break
        case "-name":
            var nameIndex = args(++i)
            break
        case "-n":
        case "--dry-run":
            dryRun = true
            WScript.Echo("Dry run - no tracks will be renamed.")
            break
        default:
            if (args(i).substr(0,1) == "-") {
                WScript.Echo("Unknown argument "+args(i))
                WScript.Quit(1)
            }
            var regex = args(i) 
        }
    }
} catch (e) {
    if (e instanceof RangeError) {
        WScript.Echo("Required argument for "+args(i-1)+" is missing")
        WScript.Quit(1)
    }
}

var sysTempFolder = fso.GetSpecialFolder(2) // 2 - TemporaryFolder

try {
    log("Connecting to iTunes COM server...")
    var iTunesApp = WScript.CreateObject("iTunes.Application")
} catch (e) {
    WScript.Echo("iTunes COM server did not respond. Close iTunes and run this script again.")
    WScript.Echo("Error Message: " + e.message)
    WScript.Echo("Error Code: " + e.number & 0xFFFF)
    WScript.Echo("Error Name: " + e.name)
    WScript.Quit(1)
}

var iTunesLibrary = iTunesApp.LibraryPlaylist
var iTunesSelectedTracks = iTunesApp.SelectedTracks
if (iTunesSelectedTracks == null) {
    WScript.Echo("No tracks selected in iTunes. Select one or more tracks and run this script again.")
    WScript.Quit(1)
}

for (var i = 1; i <= iTunesSelectedTracks.Count; i++) {
    var track = iTunesSelectedTracks.Item(i)

    // Check that track has kind 1 (ITTrackKindFile)
    if (track.Kind != 1) { 
        WScript.Echo("Track '"+track.Name+"' is not a file track, skipping")
        continue
    }

    if (track.Location == "") {
        WScript.Echo("The file for track '"+track.Name+"' seems to be missing, skipping")
        continue
    } 

    var trackFileName = fso.GetBaseName(track.Location)

    var result = trackFileName.match(regex)
    for (var m = 0; m < result.length; m++) {
        if (m == showIndex)    track.Show = result[m]
        if (m == seasonIndex)  track.SeasonNumber = result[m]
        if (m == episodeIndex) track.EpisodeNumber = result[m]
        if (m == nameIndex)    track.Name = result[m]
    }
    track.VideoKind = 3 // ITVideoKindTVShow 

    if (!dryRun) {
//        track.Name = fso.GetBaseName(track.Location)
    }
}
