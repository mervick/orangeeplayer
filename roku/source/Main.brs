Function Main(params as Dynamic) as void
  print params

  Eval("GetGlobalAA().OrangeeTVPlugin = OrangeeTVPlugin")

  device_token = RegRead("device_token")
  if device_token = invalid
    ShowLinkScreen()
  end if

	if (params <> invalid)
    streamFormat = "mp4"
    play_start = 0
    if (params.videoUrl <> invalid)
      videoUrl = params.videoUrl
    endif
    if (params.streamFormat <> invalid)
      streamFormat = params.streamFormat
    endif
    if (params.play_start <> invalid)
      play_start = params.play_start
    endif
    'LaunchVideo(params.videoURL)
		'return
	endif

  ShowPosterScreen("http://api.orangee.tv/getSubscription?token=" + device_token, "", "")
End Function

function LoadConfig(url)
	result = []

	app = CreateObject("roAppManager")
	theme = CreateObject("roAssociativeArray")
  theme.OverhangSliceSD = "pkg:/images/Overhang_BackgroundSlice_SD43.png"
	theme.OverhangSliceHD = "pkg:/images/Overhang_BackgroundSlice_HD.png"
	theme.OverhanglogoHD = "pkg:/images/Logo_Overhang_Roku_SDK_SD43.png"
	theme.OverhanglogoSD = "pkg:/images/Logo_Overhang_Roku_SDK_SD43.png"

	theme.OverhangPrimaryLogoOffsetHD_X = "35"
	theme.OverhangPrimaryLogoOffsetHD_Y = "20"

	theme.OverhangPrimaryLogoOffsetSD_X = "30"
	theme.OverhangPrimaryLogoOffsetSD_Y = "5"

	'raw = ReadASCIIFile("pkg:/config.opml")
  raw = NWM_GetStringFromURL(url)
  print url
	opml = CreateObject("roXMLElement")
	if opml.Parse(raw)
		theme.backgroundColor = ValidStr(opml.body@backgroundColor)
		theme.breadcrumbTextLeft = ValidStr(opml.body@leftBreadcrumbColor)
		theme.breadcrumbDelimiter = ValidStr(opml.body@rightBreadcrumbColor)
		theme.breadcrumbTextRight = ValidStr(opml.body@rightBreadcrumbColor)
		
		theme.posterScreenLine1Text = ValidStr(opml.body@posterScreenTitleColor)
		theme.posterScreenLine2Text = ValidStr(opml.body@posterScreenSubtitleColor)
		theme.episodeSynopsisText = ValidStr(opml.body@posterScreenSynopsisColor)
		
		theme.springboardTitleText = ValidStr(opml.body@springboardScreenTitleColor)
		theme.springboardSynopsisColor = ValidStr(opml.body@springboardScreenSynopsisColor)
		theme.springboardRuntimeColor = ValidStr(opml.body@springboardScreenDateColor)
		theme.springboardDirectorColor = ValidStr(opml.body@springboardScreenDirectorColor)
		theme.springboardDirectorLabelColor = ValidStr(opml.body@springboardScreenDirectorColor)
		theme.springboardActorColor = ValidStr(opml.body@springboardScreenActorColor)

		for each category in opml.body.outline
			result.Push(BuildCategory(category))
		next
	end if

	app.SetTheme(theme)
	
	return result
end function

function BuildCategory(category)
	result = {
		shortDescriptionLine1:	ValidStr(category@title)
		shortDescriptionLine2:	ValidStr(category@subtitle)
		sdPosterURL:						ValidStr(category@img)
		hdPosterURL:						ValidStr(category@img)
		url:										ValidStr(category@url)
		type:										ValidStr(category@type)
		categories:							[]
    streams:                []
	}

  newStream = {
    url:  ValidStr(category@url)
  }
  result.streams.Push(newStream)
	
	if category.outline.Count() > 0
		for each subCategory in category.outline
			result.categories.Push(BuildCategory(subCategory))
		next
	end if

	return result
end function
