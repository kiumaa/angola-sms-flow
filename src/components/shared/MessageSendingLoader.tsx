
import Player from 'react-lottie-player';

const MessageSendingLoader = () => {
  // Animação de avião de papel voando
  const paperPlaneAnimation = {
    "v": "5.7.4",
    "fr": 60,
    "ip": 0,
    "op": 180,
    "w": 400,
    "h": 400,
    "nm": "Paper Plane",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Paper Plane",
        "sr": 1,
        "ks": {
          "o": { "a": 0, "k": 100 },
          "r": {
            "a": 1,
            "k": [
              { "t": 0, "s": [0] },
              { "t": 60, "s": [5] },
              { "t": 120, "s": [-5] },
              { "t": 180, "s": [0] }
            ]
          },
          "p": {
            "a": 1,
            "k": [
              { "t": 0, "s": [50, 200, 0] },
              { "t": 90, "s": [350, 180, 0] },
              { "t": 180, "s": [50, 200, 0] }
            ]
          },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [100, 100, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ty": "sh",
                "d": 1,
                "ks": {
                  "a": 0,
                  "k": {
                    "i": [[0,0],[0,0],[0,0],[0,0]],
                    "o": [[0,0],[0,0],[0,0],[0,0]],
                    "v": [[0,-15],[25,0],[0,15],[-10,5]],
                    "c": true
                  }
                }
              },
              {
                "ty": "fl",
                "c": { "a": 0, "k": [0.2, 0.6, 1, 1] },
                "o": { "a": 0, "k": 100 }
              },
              {
                "ty": "st",
                "c": { "a": 0, "k": [0.1, 0.4, 0.8, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 2 }
              }
            ]
          }
        ],
        "ip": 0,
        "op": 180,
        "st": 0
      },
      {
        "ddd": 0,
        "ind": 2,
        "ty": 4,
        "nm": "Trail",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "t": 0, "s": [30] },
              { "t": 90, "s": [60] },
              { "t": 180, "s": [30] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "t": 0, "s": [40, 205, 0] },
              { "t": 90, "s": [340, 185, 0] },
              { "t": 180, "s": [40, 205, 0] }
            ]
          },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [100, 100, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ty": "el",
                "d": 1,
                "s": { "a": 0, "k": [15, 4] },
                "p": { "a": 0, "k": [0, 0] }
              },
              {
                "ty": "fl",
                "c": { "a": 0, "k": [0.8, 0.9, 1, 1] },
                "o": { "a": 0, "k": 100 }
              }
            ]
          }
        ],
        "ip": 0,
        "op": 180,
        "st": 0
      },
      {
        "ddd": 0,
        "ind": 3,
        "ty": 4,
        "nm": "Clouds",
        "sr": 1,
        "ks": {
          "o": { "a": 0, "k": 20 },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "t": 0, "s": [300, 120, 0] },
              { "t": 180, "s": [100, 120, 0] }
            ]
          },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [80, 80, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ty": "el",
                "d": 1,
                "s": { "a": 0, "k": [40, 25] },
                "p": { "a": 0, "k": [0, 0] }
              },
              {
                "ty": "fl",
                "c": { "a": 0, "k": [0.9, 0.95, 1, 1] },
                "o": { "a": 0, "k": 100 }
              }
            ]
          }
        ],
        "ip": 0,
        "op": 180,
        "st": 0
      }
    ]
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex justify-center">
        <Player
          play
          loop
          animationData={paperPlaneAnimation}
          style={{ height: '200px', width: '200px' }}
          className="opacity-90"
        />
      </div>
    </div>
  );
};

export default MessageSendingLoader;
