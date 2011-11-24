function log(s) {
    if (verbose) WScript.Echo(s)
}

function waitForCompletion(status) {
    var tn = status.TrackName
    if (tn) WScript.StdOut.Write(tn)
    while ( status.InProgress ) {
        var percentile = Math.round(status.ProgressValue/status.MaxProgressValue*100)
        WScript.StdOut.Write("..."+percentile+"%")
        WScript.Sleep(500)
    }
    if (status.Tracks != null) {
        WScript.Echo(" Done!")
        return status.Tracks.Item(1)
    } else {
        WScript.Echo(" Conversion failed")
        return null
    }
}

function isANSIString(s) {
    var tempPathname = fso.BuildPath(tempFolderPath, fso.GetTempName())
    var tempFile = fso.CreateTextFile(tempPathname, true)
    tempFile.Write(s)
    tempFile.Close()
    
    tempFile = fso.OpenTextFile(
        tempPathname, 
        1,           // For reading
        false,       // Do not create if absent
        0)           // ANSI
    var probe = tempFile.ReadLine()
    tempFile.Close()
    fso.DeleteFile(tempPathname)
    return probe == s
}

var verbose = true
WScript.Interactive = true
var WSH = new ActiveXObject("WScript.Shell")

var fso = new ActiveXObject("Scripting.FileSystemObject")

var src = fso.GetFolder("test\\test") //Dalida")

var args = WScript.Arguments
WScript.Echo(args.length)

for (var i = 0; i < args.length; i++) {
    WScript.Echo(i+":"+args(i))
    if (args(i).charAt(0) != "-") {
        src = fso.GetFolder(args(i))
    }
}

var tempFolder = fso.GetSpecialFolder(2) // 2 - TemporaryFolder
var tempFolderPath = tempFolder.Path
log("Using "+tempFolderPath+" for storing temporary files")

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

var iTunesLibrary = iTunesApp.LibraryPlaylist;

var savedEncoder = iTunesApp.CurrentEncoder
if (savedEncoder.Name != "Lossless Encoder") {
    log("Current Encoder: "+savedEncoder.Name)
    var encoders = new Enumerator(iTunesApp.Encoders)
    for (encoders.moveFirst(); !encoders.atEnd(); encoders.moveNext()) {
        var encoder = encoders.item()
        if (encoder.Name == "Lossless Encoder")
            iTunesApp.CurrentEncoder = encoder
    }
}

transcodeList = fso.CreateTextFile("transcoded.lst", true, true)

log("Importing FLAC files from "+src.Name)

function Traverse(folder) {
    log("Entered "+folder.Path)
    var files = new Enumerator(folder.Files)
    folderScanLoop:
    for (files.moveFirst(); !files.atEnd(); files.moveNext()) {
        file = files.item()
        if (/.flac$/i.test(file.Name)) {
            log("Found FLAC file "+file.Path)
           
            if (!isANSIString(file.Path)) {
                log("File name contains non-ANSI characters")
                var tempFLACPath = fso.BuildPath(tempFolderPath, 'temp.flac')
                fso.CopyFile(file.Path, tempFLACPath, true)
                sourcePath = tempFLACPath
            } else {
                sourcePath = file.Path
            }

            log("Extracting metadata from "+sourcePath)
//            exec = WSH.Exec('metaflac --export-tags-to=- "'+sourcePath+'"')
            var utf8MetadataFilePath = fso.BuildPath(tempFolderPath, 'temp.utf8')
            exec = WSH.Exec('metaflac --export-tags-to="'+utf8MetadataFilePath+'" --no-utf8-convert "'+sourcePath+'"')
            while (exec.Status == 0) {
                WScript.Sleep(100)
            }

            var utf8MetadataFile = 
                fso.OpenTextFile(
                    utf8MetadataFilePath,
                    1,      // ForReading
                    false,  // Do not create if absent
                    0)      // ANSI
            var metadata = utf8MetadataFile.ReadAll()
            utf8MetadataFile.Close()

            if (!metadata.match(/[^\x01-\x7e]/)) 
                WScript.Echo("ASCII metadata, no transcoding needed")
            else {
                WScript.Echo("Transcoding metadata from UTF-8 to Unicode")
                exec = WSH.Exec('cmd /c UTF8toUnicode tags <"'+utf8MetadataFilePath+'"')
                while (exec.Status == 0) {
                    WScript.Sleep(100)
                }
                var unicodeMetadataFile = fso.OpenTextFile("tags",1,false,-1)
                var metadata = unicodeMetadataFile.ReadAll()
                unicodeMetadataFile.Close()
                transcodeList.WriteLine(file.Path)
            }

//            continue folderScanLoop;
            
            metadata = metadata.split(/\r\n|\r|\n/)

            var tags = []

            for (var i in metadata) {
                var pair = metadata[i].match(/(.+?)=(.+)/)
                if (pair) {
                    switch(pair[1]) {
                    case 'ARTIST':
                        tags['Artist'] = pair[2]
                        break
                    case 'TITLE':
                        tags['Title'] = pair[2]
                        break
                    case 'ALBUM':
                        tags['Album'] = pair[2]
                        break
                    case 'DATE':
                        tags['Date'] = pair[2]
                        break
                    case 'TRACKNUMBER':
                        tags['TrackNumber'] = pair[2]
                        break
                    case 'GENRE':
                        tags['Genre'] = pair[2]
                        break
                    case 'COMMENT':
                        break
                    }
                }
            }

            if (typeof tags.Title == "undefined") {
                WScript.Echo("No track title in metadata, skipping")
                continue folderScanLoop;
            }

            WScript.Echo(tags.Title)

            var similar = iTunesLibrary.Search(tags.Title, 5)
            if (similar) {
                for (i = 1; i<= similar.Count; i++) {
                    var track = similar.Item(i)
                    if (track.Name   == tags.Title &&
                        track.Album  == tags.Album &&
                        track.Artist == tags.Artist) {
                        WScript.Echo("Track already in library")
                        continue folderScanLoop;
                    }
                }

            }

            var tempWAVPath = fso.BuildPath(tempFolderPath, 'temp.wav')
            log("Decompressing FLAC file into "+tempWAVPath)

            exec = WSH.Exec('flac.exe -s -d -o "'+tempWAVPath+'" "'+sourcePath+'"')
            while (exec.Status == 0) {
                WScript.Sleep(100)
            }
            
            var tempWAVPath2 = fso.BuildPath(tempFolderPath, file.Name.replace(/\.[^\.]+$/, '.wav'))
            log("Renaming WAV file to "+tempWAVPath2)
            if (fso.FileExists(tempWAVPath2)) fso.DeleteFile(tempWAVPath2)
            fso.MoveFile(tempWAVPath, tempWAVPath2)

            log("Converting WAV file to track")
            var status = iTunesApp.ConvertFile2(tempWAVPath2)
            var track = waitForCompletion(status)

            log("Writing metadata")
            if ('Artist' in tags) track.Artist = tags.Artist
            if ('Title' in tags) track.Name = tags.Title
            if ('Album' in tags) track.Album = tags.Album
            if ('Genre' in tags) track.Genre = tags.Genre
            if ('TrackNumber' in tags) track.TrackNumber = tags.TrackNumber
            if ('Date' in tags) track.Year = tags.Date

            // As there was no metadata in the intermediate WAV file, 
            // the file containing the track was stored under 
            // "Unknown Artist\Unknown Album" subfolder of the iTunes library. 
            // Setting the metadata does NOT cause iTunes to move the file 
            // to the appropriate subfolder, UNLESS the option 
            // "Keep iTunes Media folder organized" is set 
            // under Preferences/Advanced. If the option is not set,
            // converting the track again will do the trick.
            // Only the metadata will be different in the resulting file.
            if (track.Location.indexOf("\\Unknown Artist\\Unknown Album\\") != -1) {
                log("Converting track")
                status = iTunesApp.ConvertTrack2(track)
                waitForCompletion(status)
                log("Deleting intermediate track")
                log(track.Location)
                track.Delete()
            }
            log("Deleting temporary WAV file")
            fso.DeleteFile(tempWAVPath2)
        }
    }
    var subfolders = new Enumerator(folder.SubFolders)
    for(subfolders.moveFirst(); !subfolders.atEnd(); subfolders.moveNext()) {
        subfolder = subfolders.item()
        WScript.Echo(subfolder.Name)
        Traverse(subfolder)
    }
}

Traverse(src)

transcodeList.Close()