Function ParseCSV(url As String) as Object
  raw = NWM_GetStringFromURL(url)
  result = []

  a = raw.tokenize(chr(10))

  For Each line In a
    if Left(line, 1) <> "#" AND line.Trim().Len() > 0
      if Instr(1, line, ",") > 0
        print "comma"
        b = line.tokenize(",")
      else
        print "no comma"
        b = line.tokenize(" ")
      end if
      newItem = {
          streams:			[]
          streamFormat:	"hls"
          actors:				[]
          categories:		[]
          contentType:	"episode"
      }
      if LCase(Left(line, 4)) = "http"
        media = b[0]
        image = b[1]
      else
        newItem.title = b[0]
        media = b[1]
        image = b[2]
      end if
      print "------------"
      print newItem.title
      print media
      if media <> invalid AND media.Len() > 0
        newStream = {
					url:	media
				}
        newItem.streams.Push(newStream)
        if Right(media, 5) <> ".m3u8"
          newItem.streamFormat = "mp4"
        end if
        if image = invalid OR image.Trim().Len() = 0
          ytid = FindYoutubeId(media)
          if ytid <> invalid
            image = "http://i.ytimg.com/vi/" + ytid + "/mqdefault.jpg"
          end if
        end if
        print image
        newItem.sdPosterURL = image
        newItem.hdPosterURL = image
        newItem.url = media 'referer

        result.Push(newItem)
      end if
    end if
  End For

  return result
End Function

Function FindYoutubeId(url As String) as Object
  if InStr(1, url, "youtube.com") > 0
    a = CreateObject("roRegex", "v=", "i").split(url)
    print "AAA"
    print a
    return a[1]
  else if Instr(1, url, "youtu.be") > 0
    a = url.tokenize("/")
    return a.GetTail()
  else
    return invalid
  end if
End Function
