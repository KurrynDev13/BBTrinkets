import { useEffect } from 'react';

export default function VoiceflowWidget() {
  useEffect(() => {
    const projectId = import.meta.env.VITE_VOICEFLOW_PROJECT_ID;
    
    // Only load if configured, otherwise we'll just log
    if (!projectId) {
      console.log('Voiceflow Project ID not configured. Widget will not load.');
      return;
    }

    const script = document.createElement('script');
    script.onload = () => {
      // @ts-ignore
      window.voiceflow.chat.load({
        verify: { projectID: projectId },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production'
      });
    };
    script.src = 'https://cdn.voiceflow.com/widget/bundle.mjs';
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return null;
}
