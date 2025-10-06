import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: string;
}

interface VoiceSelectorProps {
  form: any;
  name: string;
  label?: string;
}

export default function VoiceSelector({ form, name, label = "Voice Selection" }: VoiceSelectorProps) {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const { data: voices = [], isLoading } = useQuery({
    queryKey: ["/api/voices/available"],
  });

  const selectedVoiceId = form.watch(name);
  const selectedVoice = voices.find((voice: Voice) => voice.id === selectedVoiceId);
  
  // If no voice is selected, default to the first voice (Old American Man)
  const currentVoice = selectedVoice || voices[0];

  const playVoicePreview = async (voiceId: string) => {
    try {
      // Stop current audio if playing
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
        setPlayingVoiceId(null);
      }

      if (playingVoiceId === voiceId) {
        return; // Just stop if clicking the same voice
      }

      setPlayingVoiceId(voiceId);

      // Use direct URL streaming for better browser compatibility
      const audioUrl = `/api/voices/preview/${voiceId}?text=${encodeURIComponent("Hello, this is a preview of my voice. I hope you enjoy our conversations together.")}&t=${Date.now()}`;
      const audio = new Audio(audioUrl);
      
      console.log('Creating audio element with URL:', audioUrl);
      
      // Add comprehensive event listeners for debugging
      audio.addEventListener('loadstart', () => console.log('Audio loading started'));
      audio.addEventListener('loadeddata', () => console.log('Audio data loaded'));
      audio.addEventListener('canplay', () => console.log('Audio can start playing'));
      audio.addEventListener('playing', () => console.log('Audio started playing'));
      audio.addEventListener('error', (e) => {
        console.error('Audio element error:', e);
        console.error('Audio error details:', audio.error);
      });

      audio.onended = () => {
        setPlayingVoiceId(null);
        setAudioElement(null);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        console.error('Audio error code:', audio.error?.code);
        console.error('Audio error message:', audio.error?.message);
        setPlayingVoiceId(null);
        setAudioElement(null);
        toast({
          title: "Playback Error",
          description: "Could not play voice preview - check audio format",
          variant: "destructive",
        });
      };

      setAudioElement(audio);
      await audio.play();
    } catch (error) {
      console.error('Voice preview error:', error);
      setPlayingVoiceId(null);
      toast({
        title: "Preview Failed",
        description: "Could not generate voice preview. Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const stopPreview = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setPlayingVoiceId(null);
    }
  };

  if (isLoading) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </FormControl>
        <FormMessage />
      </FormItem>
    );
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl className="flex-1">
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voice for calls" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice: Voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-sm text-gray-600">{voice.description}</div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {voice.gender}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            
            {currentVoice && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => playingVoiceId === currentVoice.id ? stopPreview() : playVoicePreview(currentVoice.id)}
                disabled={playingVoiceId !== null && playingVoiceId !== currentVoice.id}
                className="shrink-0"
              >
                {playingVoiceId === currentVoice.id ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}