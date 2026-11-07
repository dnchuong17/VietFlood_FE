"use client";

import {
    createContext,
    type Dispatch,
    type ReactNode,
    useContext,
    useMemo,
    useReducer,
} from "react";

export type MapOverlay = "rain" | "wind" | "temp" | "clouds" | "pressure" | "rh";

const OVERLAY_SEQUENCE: MapOverlay[] = ["rain", "wind", "temp", "rh", "clouds", "pressure"];

type HomeDisplayState = {
    isWeatherStatsVisible: boolean;
    overlay: MapOverlay;
};

type HomeDisplayAction =
    | { type: "toggleWeatherStatsVisibility" }
    | { type: "setWeatherStatsVisibility"; payload: boolean }
    | { type: "cycleOverlay" }
    | { type: "setOverlay"; payload: MapOverlay };

const initialHomeDisplayState: HomeDisplayState = {
    isWeatherStatsVisible: false,
    overlay: "rain",
};

function homeDisplayReducer(
    state: HomeDisplayState,
    action: HomeDisplayAction,
): HomeDisplayState {
    switch (action.type) {
        case "toggleWeatherStatsVisibility":
            return {
                ...state,
                isWeatherStatsVisible: !state.isWeatherStatsVisible,
            };
        case "setWeatherStatsVisibility":
            return { ...state, isWeatherStatsVisible: action.payload };
        case "cycleOverlay": {
            const currentIndex = OVERLAY_SEQUENCE.indexOf(state.overlay);
            const nextIndex = (currentIndex + 1) % OVERLAY_SEQUENCE.length;

            return {
                ...state,
                overlay: OVERLAY_SEQUENCE[nextIndex],
            };
        }
        case "setOverlay":
            return { ...state, overlay: action.payload };
        default:
            return state;
    }
}

type HomeDisplayContextValue = {
    state: HomeDisplayState;
    dispatch: Dispatch<HomeDisplayAction>;
};

const HomeDisplayContext = createContext<HomeDisplayContextValue | null>(null);

export function HomeDisplayProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(homeDisplayReducer, initialHomeDisplayState);
    const value = useMemo(() => ({ state, dispatch }), [state]);

    return <HomeDisplayContext.Provider value={value}>{children}</HomeDisplayContext.Provider>;
}

export function useHomeDisplayState() {
    const context = useContext(HomeDisplayContext);

    if (!context) {
        throw new Error("useHomeDisplayState must be used within HomeDisplayProvider");
    }

    return context;
}
