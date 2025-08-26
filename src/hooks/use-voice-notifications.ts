import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/hooks/use-settings';

interface Voice extends SpeechSynthesisVoice {
  voiceURI: string;
  name: string;
  lang: string;
}

export function useVoiceNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  
  const { settings } = useSettings();

  // 음성 합성 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      // 음성 목록 로드
      const loadVoices = () => {
        const voices = synth.getVoices();
        const koreanVoices = voices.filter(voice => 
          voice.lang.startsWith('ko') || voice.lang.startsWith('ko-KR')
        );
        const otherVoices = voices.filter(voice => 
          !voice.lang.startsWith('ko') && !voice.lang.startsWith('ko-KR')
        );
        
        // 한국어 음성을 우선으로 정렬
        const sortedVoices = [...koreanVoices, ...otherVoices];
        setAvailableVoices(sortedVoices);
        
        // 기본 음성 설정 (한국어 음성이 있으면 첫 번째, 없으면 첫 번째)
        if (sortedVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(sortedVoices[0].voiceURI);
        }
      };

      // 음성 목록이 로드되면 실행
      if (synth.getVoices().length > 0) {
        loadVoices();
      } else {
        synth.addEventListener('voiceschanged', loadVoices);
      }

      return () => {
        synth.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [selectedVoice]);

  // 설정에서 음성 알림 활성화 상태 동기화
  useEffect(() => {
    if (settings?.orderTransferSettings?.voiceNotificationEnabled !== undefined) {
      setIsEnabled(settings.orderTransferSettings.voiceNotificationEnabled);
    }
  }, [settings?.orderTransferSettings?.voiceNotificationEnabled]);

  // 음성 알림 토글
  const toggleVoiceNotification = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  // 음성 선택 변경
  const changeVoice = useCallback((voiceURI: string) => {
    setSelectedVoice(voiceURI);
  }, []);

  // 음성 재생
  const speakMessage = useCallback((message: string) => {
    if (!speechSynthesis || !isEnabled || !selectedVoice) {
      return;
    }

    // 현재 재생 중인 음성 중지
    if (currentUtterance) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = availableVoices.find(voice => voice.voiceURI === selectedVoice) || null;
    utterance.rate = 0.9; // 속도 조절
    utterance.pitch = 1.0; // 음높이
    utterance.volume = 1.0; // 볼륨

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentUtterance(utterance);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    utterance.onerror = (event) => {
      console.error('음성 재생 오류:', event);
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    speechSynthesis.speak(utterance);
  }, [speechSynthesis, isEnabled, selectedVoice, availableVoices, currentUtterance]);

  // 음성 중지
  const stopSpeaking = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentUtterance(null);
    }
  }, [speechSynthesis]);

  // 주문 이관 알림
  const notifyOrderTransfer = useCallback((orderBranchName: string) => {
    const message = `${orderBranchName}지점으로부터 주문이 이관되었습니다.`;
    speakMessage(message);
  }, [speakMessage]);

  // 새 주문 알림
  const notifyNewOrder = useCallback((orderNumber: string) => {
    const message = `새로운 주문이 접수되었습니다. 주문번호: ${orderNumber}`;
    speakMessage(message);
  }, [speakMessage]);

  // 배송 완료 알림
  const notifyDeliveryComplete = useCallback((orderNumber: string) => {
    const message = `주문번호 ${orderNumber}의 배송이 완료되었습니다.`;
    speakMessage(message);
  }, [speakMessage]);

  // 테스트 음성 알림
  const testVoiceNotification = useCallback((message: string) => {
    speakMessage(message);
  }, [speakMessage]);

  // 사용 가능한 음성 목록 가져오기
  const getAvailableVoices = useCallback(() => {
    return availableVoices;
  }, [availableVoices]);

  return {
    isEnabled,
    selectedVoice,
    availableVoices,
    isSpeaking,
    toggleVoiceNotification,
    changeVoice,
    speakMessage,
    stopSpeaking,
    notifyOrderTransfer,
    notifyNewOrder,
    notifyDeliveryComplete,
    testVoiceNotification,
    getAvailableVoices
  };
}
