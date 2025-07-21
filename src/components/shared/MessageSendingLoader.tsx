
import Player from 'react-lottie-player';

const MessageSendingLoader = () => {
  // Animação Lottie inline de envio de mensagem (JSON otimizado)
  const messageAnimation = {
    "v": "5.7.4",
    "fr": 30,
    "ip": 0,
    "op": 90,
    "w": 400,
    "h": 400,
    "nm": "SMS Sending",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Phone",
        "sr": 1,
        "ks": {
          "o": { "a": 0, "k": 100 },
          "r": { "a": 0, "k": 0 },
          "p": { "a": 0, "k": [200, 200, 0] },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [100, 100, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ty": "rc",
                "d": 1,
                "s": { "a": 0, "k": [80, 140] },
                "p": { "a": 0, "k": [0, 0] },
                "r": { "a": 0, "k": 12 }
              },
              {
                "ty": "st",
                "c": { "a": 0, "k": [0.2, 0.4, 1, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 3 }
              },
              {
                "ty": "fl",
                "c": { "a": 0, "k": [0.95, 0.95, 0.95, 1] },
                "o": { "a": 0, "k": 100 }
              }
            ]
          }
        ],
        "ip": 0,
        "op": 90,
        "st": 0
      },
      {
        "ddd": 0,
        "ind": 2,
        "ty": 4,
        "nm": "Message Bubble",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": [0] },
              { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 30, "s": [100] },
              { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 60, "s": [100] },
              { "t": 90, "s": [0] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "i": { "x": 0.833, "y": 0.833 }, "o": { "x": 0.167, "y": 0.167 }, "t": 0, "s": [160, 160, 0] },
              { "i": { "x": 0.833, "y": 0.833 }, "o": { "x": 0.167, "y": 0.167 }, "t": 30, "s": [240, 140, 0] },
              { "t": 60, "s": [320, 120, 0] }
            ]
          },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": {
            "a": 1,
            "k": [
              { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 0, "s": [0, 0, 100] },
              { "t": 30, "s": [100, 100, 100] }
            ]
          }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ty": "rc",
                "d": 1,
                "s": { "a": 0, "k": [60, 30] },
                "p": { "a": 0, "k": [0, 0] },
                "r": { "a": 0, "k": 15 }
              },
              {
                "ty": "fl",
                "c": { "a": 0, "k": [0.2, 0.7, 0.3, 1] },
                "o": { "a": 0, "k": 100 }
              }
            ]
          }
        ],
        "ip": 0,
        "op": 90,
        "st": 0
      }
    ]
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Player
            play
            loop
            animationData={messageAnimation}
            style={{ height: '120px', width: '120px' }}
            className="opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground animate-pulse">
            Preparando plataforma SMS
          </h3>
          <p className="text-sm text-muted-foreground">
            Conectando aos gateways de alta entrega...
          </p>
        </div>
        
        {/* Fallback loading dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default MessageSendingLoader;
