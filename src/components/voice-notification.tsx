"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Play, Square } from "lucide-react";
import { useVoiceNotifications } from "@/hooks/use-voice-notifications";

export function VoiceNotification() {
  const {
    isEnabled,
    selectedVoice,
    availableVoices,
    toggleVoiceNotification,
    testVoiceNotification,
    speakMessage,
    stopSpeaking,
    isSpeaking
  } = useVoiceNotifications();

  const [testMessage, setTestMessage] = useState("테스트 메시지입니다.");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          음성 알림 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-enabled">음성 알림 활성화</Label>
          <Switch
            id="voice-enabled"
            checked={isEnabled}
            onCheckedChange={toggleVoiceNotification}
          />
        </div>

        {isEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="voice-select">음성 선택</Label>
              <Select value={selectedVoice} onValueChange={(value) => {
                // 음성 변경 로직은 useVoiceNotifications에서 처리
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="음성을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-message">테스트 메시지</Label>
              <div className="flex gap-2">
                <input
                  id="test-message"
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="테스트할 메시지를 입력하세요"
                />
                <Button
                  onClick={() => testVoiceNotification(testMessage)}
                  disabled={isSpeaking}
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                </Button>
                {isSpeaking && (
                  <Button
                    onClick={stopSpeaking}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => speakMessage("***지점으로부터 주문이 이관되었습니다.")}
                disabled={isSpeaking}
                className="w-full"
              >
                <Volume2 className="mr-2 h-4 w-4" />
                주문 이관 알림 테스트
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
