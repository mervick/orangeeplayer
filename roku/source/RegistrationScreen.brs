Function RegRead(key, section=invalid)
    if section = invalid then section = "Default"
    sec = CreateObject("roRegistrySection", section)
    if sec.Exists(key) then return sec.Read(key)
    return invalid
End Function

Function RegWrite(key, val, section=invalid)
    if section = invalid then section = "Default"
    sec = CreateObject("roRegistrySection", section)
    sec.Write(key, val)
    sec.Flush() 'commit it
End Function


function GetLinkingCode()
  result = invalid

  xfer = CreateObject("roURLTransfer")
  xfer.SetURL("http://api.orangee.tv/getLinkingCode")
  response = xfer.GetToString()
  xml = CreateObject("roXMLElement")
  if xml.Parse(response)
    result = {
      code: xml.linkingCode.GetText()
      expires: StrToI(xml.linkingCode@expires)
    }
  end if

  return result
end function

function ValidateLinkingCode(linkingCode)
  result = false

  xfer = CreateObject("roURLTransfer")
  xfer.SetURL("http://api.orangee.tv/validateLinkingCode?code=" + linkingCode)
  response = xfer.GetToString()
  xml = CreateObject("roXMLElement")
  if xml.Parse(response)
    if UCase(xml.status.GetText()) = "SUCCESS"
      RegWrite("device_token", xml.deviceToken.GetText())
      result = true
    end if
  end if

  return result
end function


sub ShowLinkScreen()
  dt = CreateObject("roDateTime")

  ' create a roCodeRegistrationScreen and assign it a roMessagePort
  port = CreateObject("roMessagePort")
  screen = CreateObject("roCodeRegistrationScreen")
  screen.SetMessagePort(port)

  ' add some header text
  screen.AddHeaderText("Link Your Account")
  ' add some buttons
  screen.AddButton(1, "Get new code")
  screen.AddButton(2, "Back")
  ' Add a short narrative explaining what this screen is
  screen.AddParagraph("Before you can use this channel, you must link the channel to your account.")
  ' Focal text should give specific instructions to the user
  screen.AddFocalText("Go to http://www.orangee.tv/link, log into your account, and enter the following code.", "spacing-normal")

  ' display a retrieving message until we get a linking code
  screen.SetRegistrationCode("Retrieving...")
  screen.Show()

  ' get a new code
  linkingCode = GetLinkingCode()
  if linkingCode <> invalid
    screen.SetRegistrationCode(linkingCode.code)
  else
    screen.SetRegistrationCode("Failed to get code...")
  end if
 
  screen.Show()

  while true
    ' we want to poll the API every 15 seconds for validation,
    ' so set a 15000 millisecond timeout on the Wait()
    msg = Wait(15000, screen.GetMessagePort())
   
    if msg = invalid
      ' poll the API for validation
      if ValidateLinkingCode(linkingCode.code)
        ' if validation succeeded, close the screen
        exit while
      end if

      dt.Mark()
      if dt.AsSeconds() > linkingCode.expires
        ' the code expired. display a message, then get a new one
        d = CreateObject("roMessageDialog")
        dPort = CreateObject("roMessagePort")
        d.SetMessagePort(dPort)
        d.SetTitle("Code Expired")
        d.SetText("This code has expired. Press OK to get a new one")
        d.AddButton(1, "OK")
        d.Show()

        Wait(0, dPort)
        d.Close()
        screen.SetRegistrationCode("Retrieving...")
        screen.Show()

        linkingCode = GetLinkingCode()
        if linkingCode <> invalid
          screen.SetRegistrationCode(linkingCode.code)
        else
          screen.SetRegistrationCode("Failed to get code...")
        end if
        screen.Show()
      end if
    else if type(msg) = "roCodeRegistrationScreenEvent"
      if msg.isScreenClosed()
        exit while
      else if msg.isButtonPressed()
        if msg.GetIndex() = 1
          ' the user wants a new code
          code = GetLinkingCode()
          linkingCode = GetLinkingCode()
          if linkingCode <> invalid
            screen.SetRegistrationCode(linkingCode.code)
          else
            screen.SetRegistrationCode("Failed to get code...")
          end if
          screen.Show()
        else if msg.GetIndex() = 2
          ' the user wants to close the screen
          exit while
        end if
      end if
    end if
  end while
 
  screen.Close()
end sub
