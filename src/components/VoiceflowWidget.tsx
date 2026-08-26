import { useEffect } from 'react';

export default function VoiceflowWidget() {
  useEffect(() => {
    const projectId = import.meta.env.VITE_VOICEFLOW_PROJECT_ID;
    
    // Only load if configured, otherwise we'll just log
    if (!projectId) {
      console.log('Voiceflow Project ID not configured. Widget will not load.');
      return;
    }

    // Prevent multiple initializations during React strict mode or HMR
    if ((window as any).voiceflow?.chat) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'voiceflow-widget-script';
    script.onload = () => {
      // @ts-ignore
      window.voiceflow.chat.load({
        verify: { projectID: projectId },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'development',
        assistant: {
          title: "B&B Trinkets Assistant",
          description: "Your friendly guide to our treasures!"
        }
      });
    };
    script.src = 'https://cdn.voiceflow.com/widget/bundle.mjs';
    script.type = 'text/javascript';
    
    if (!document.getElementById('voiceflow-widget-script')) {
      document.body.appendChild(script);
    }

    return () => {
      // Do not remove the script or chat on unmount to prevent React 18 strict mode / HMR issues
    };
  }, []);

  return null;
}
