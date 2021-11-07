import { useEffect, useState, useRef } from "react";
import State from "./State";
import Keyboard from "./Keyboard";
import Pointer from "./Pointer";
import Hud from "./Hud";
import { BACKGROUND_COLOR, SAVE2X, TEXT_COLOR, TRANSPARENT } from "./Constants";

function App() {
  const canvasRef = useRef(null!);
  const printCanvasRef = useRef(null!);
  const [state, setState] = useState<null | State>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLOR);
  const [textColor, setTextColor] = useState(TEXT_COLOR);
  const [transparentBackground, setTransparentBackground] =
    useState(TRANSPARENT);
  const [save2x, setSave2x] = useState(SAVE2X);
  const keyboardRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.fonts.load('16px "custom"').then(() => {
      const newState = new State(canvasRef.current, printCanvasRef.current);
      setState(newState);
    });
  }, []);

  useEffect(() => {
    if (state) {
      state.setBackgroundColor(backgroundColor);
    }
  }, [state, backgroundColor]);

  useEffect(() => {
    if (state) {
      state.text.setColor(textColor);
    }
  }, [state, textColor]);

  useEffect(() => {
    if (state) {
      state.transparentBackground = transparentBackground;
    }
  }, [state, transparentBackground]);

  useEffect(() => {
    if (state) {
      state.save2x = save2x;
    }
  }, [state, save2x]);

  return (
    <>
      <canvas ref={canvasRef}></canvas>
      <canvas ref={printCanvasRef} style={{ display: "none" }}></canvas>
      {state ? (
        <>
          <Keyboard state={state} />
          <Pointer state={state} keyboardRef={keyboardRef} />
          <Hud
            state={state}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            aboutOpen={aboutOpen}
            setAboutOpen={setAboutOpen}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            textColor={textColor}
            setTextColor={setTextColor}
            transparentBackground={transparentBackground}
            setTransparentBackground={setTransparentBackground}
            save2x={save2x}
            setSave2x={setSave2x}
          />
        </>
      ) : null}
      <input
        ref={keyboardRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          color: "transparent",
        }}
      />
    </>
  );
}

export default App;
