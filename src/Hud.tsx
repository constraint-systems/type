import { useEffect, useState, useRef } from "react";
import State from "./State";

interface DialogProps {
  title: string;
  children: any;
  display: boolean;
  setDisplay: any;
  clearModals: any;
}

function Dialog({
  title,
  children,
  display,
  setDisplay,
  clearModals,
}: DialogProps) {
  const [offsetX, setOffSetX] = useState(0);
  const [offsetY, setOffSetY] = useState(0);
  const pointerDown = useRef(false);
  const pointerOrigin = useRef([0, 0]);
  const offsetOrigin = useRef([0, 0]);

  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (!e.ctrlKey) {
        if (press === "escape") setDisplay(false);
      }
    };

    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [display, clearModals, setDisplay]);

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ display: display ? "block" : "none" }}
    >
      <div
        className="absolute left-1/2 bg-white text-black pointer-events-auto shadow-md"
        style={{
          top: 64,
          maxHeight: "calc(100% - 128px)",
          width: 440,
          maxWidth: "calc(100% - 32px)",
          transform: `translate(calc(${offsetX}px - 50%), ${offsetY}px)`,
          border: "solid 1px #ddd",
          overflow: "auto",
        }}
      >
        <div className="flex border-b border-gray-200">
          <div
            className="px-4 py-3 select-none flex-grow"
            onPointerDown={(e) => {
              pointerDown.current = true;
              pointerOrigin.current = [e.clientX, e.clientY];
              offsetOrigin.current = [offsetX, offsetY];
            }}
            onPointerMove={(e) => {
              if (pointerDown.current) {
                setOffSetX(
                  offsetOrigin.current[0] + e.clientX - pointerOrigin.current[0]
                );
                setOffSetY(
                  offsetOrigin.current[1] + e.clientY - pointerOrigin.current[1]
                );
              }
            }}
            onPointerUp={() => {
              pointerDown.current = false;
            }}
          >
            {title}
          </div>
          <div
            role="button"
            className="px-5 py-3 hover:bg-gray-200 cursor-pointer select-none"
            onClick={() => setDisplay(false)}
          >
            X
          </div>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function Hud({
  state,
  settingsOpen,
  setSettingsOpen,
  aboutOpen,
  setAboutOpen,
  backgroundColor,
  setBackgroundColor,
  textColor,
  setTextColor,
  transparentBackground,
  setTransparentBackground,
  save2x,
  setSave2x,
}: {
  state: State;
  settingsOpen: boolean;
  setSettingsOpen: any;
  aboutOpen: boolean;
  setAboutOpen: any;
  backgroundColor: string;
  setBackgroundColor: any;
  textColor: string;
  setTextColor: any;
  transparentBackground: boolean;
  setTransparentBackground: any;
  save2x: boolean;
  setSave2x: any;
}) {
  const actions = [
    () => {
      clearModals();
      setSettingsOpen(!settingsOpen);
    },
    () => {
      clearModals();
      setAboutOpen(!aboutOpen);
    },
    () => {
      state.printImage();
    },
    () => {
      if (state.mode === "normal" || state.mode === "choosePosition") {
        state.setMode("navigation");
      } else if (state.mode === "navigation") {
        state.setMode("normal");
      }
    },
  ];

  const clearModals = () => {
    setSettingsOpen(false);
    setAboutOpen(false);
  };

  const buttons = ["settings", "about", "print"];
  if (state.touch) buttons.push("escape");

  return (
    <>
      <div
        style={{
          position: "absolute",
          right: "0.5ch",
          top: 0,
          display: "flex",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {buttons.map((text, i) => {
          return (
            <div
              className="action-button"
              key={text}
              role="button"
              style={{
                color: textColor,
                padding: "1.5ch",
                pointerEvents: "auto",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                actions[i]();
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
      <Dialog
        title="Settings"
        display={settingsOpen}
        setDisplay={setSettingsOpen}
        clearModals={clearModals}
      >
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Background color</div>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => {
              setBackgroundColor(e.target.value);
            }}
          ></input>
        </div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Text color</div>
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
            }}
          ></input>
        </div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Save at 2x resolution</div>
          <input
            type="checkbox"
            checked={save2x}
            onChange={(e) => {
              setSave2x(e.target.checked);
            }}
          ></input>
        </div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Transparent background on save</div>
          <input
            type="checkbox"
            checked={transparentBackground}
            onChange={(e) => {
              setTransparentBackground(e.target.checked);
            }}
          ></input>
        </div>
      </Dialog>
      <Dialog
        title="About"
        display={aboutOpen}
        setDisplay={setAboutOpen}
        clearModals={clearModals}
      >
        <div className="">
          <div style={{ marginBottom: "0.75em" }}>
            Type is a directed typing experiment. You choose the direction the
            letters should flow.
          </div>
          <div style={{ marginBottom: "0.75em" }}>
            <div>Controls</div>
            <ul>
              <li>Use the mouse or arrow keys to set the target</li>
              <li>Type to place the letters</li>
              <li>Enter to start a new line</li>
              <li>
                Escape to go into navigation mode where you can select, move and
                delete lines. Double click on a line to edit it
              </li>
            </ul>
          </div>
          <div style={{ marginBottom: "0.75em" }}>
            A{" "}
            <a
              target="_blank"
              href="https://constraint.systems"
              rel="noreferrer"
            >
              Constraint Systems
            </a>{" "}
            project
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default Hud;
