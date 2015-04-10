sub ShowPosterScreen(opmlurl, breadLeft, breadRight)
  print "ShowPosterScreen"
	screen = CreateObject("roPosterScreen")
	screen.SetMessagePort(CreateObject("roMessagePort"))
  screen.SetListStyle("flat-category")
  screen.SetBreadcrumbText(breadLeft, breadRight)
	screen.Show()

  contentList = LoadConfig(opmlurl)	
	screen.SetContentList(contentList)
	screen.Show()
	
	while true
		msg = wait(0, screen.GetMessagePort())
		
		if msg <> invalid
			if msg.isScreenClosed()
				exit while
			else if msg.isListItemSelected()
        selectedEpisode = msg.Getindex()
				selectedItem = contentList[msg.Getindex()]
				if Right(selectedItem.url, 5) = ".opml"
					ShowPosterScreen(selectedItem.url, selectedItem.shortDescriptionLine1, "")
        else if Left(selectedItem.type, 5) = "video"
          selectedEpisode = ShowSpringboardScreen(contentList, selectedEpisode, selectedItem.shortDescriptionLine1, "")
          screen.SetFocusedListItem(selectedEpisode)
				else
					ShowEpisodeScreen(selectedItem.url, selectedItem.shortDescriptionLine1, "")
				end if
      else if msg.isRemoteKeyPressed()
        if msg.GetIndex() = 13 AND Left(selectedItem.type, 5) = "video"
          ShowVideoScreen(contentList[selectedEpisode])
        end if
			end if
		end if
	end while
end sub
