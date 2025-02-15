#Requires AutoHotkey v2.0

; 커맨드 라인 매개변수 받기
phoneNumber := A_Args[1]
message := A_Args[2]

if (phoneNumber = "" || message = "") {
    FileAppend "Error: Missing required parameters", "*"
    ExitApp 1
}

; 카카오톡 메인 창 활성화
if (!WinExist("ahk_exe KakaoTalk.exe")) {
    FileAppend "Error: KakaoTalk is not running", "*"
    ExitApp 1
}

try {
    ; 새 채팅방 열기 (Ctrl + N)
    Send "^n"
    Sleep 1000

    ; 전화번호 입력
    SendText phoneNumber
    Sleep 1000

    ; Enter로 검색
    Send "{Enter}"
    Sleep 1000

    ; 메시지 입력
    SendText message
    Sleep 500

    ; 메시지 전송
    Send "{Enter}"
    Sleep 500

    ; 채팅방 닫기 (Ctrl + W)
    Send "^w"
    
    ; 성공 메시지 출력
    FileAppend "Success: Message sent", "*"
    ExitApp 0
}
catch Error as err {
    FileAppend "Error: " err.Message, "*"
    ExitApp 1
}