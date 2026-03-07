import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LocationData } from "@/data/zambia";

interface AppState {
  location: LocationData | null;
  setLocation: (loc: LocationData) => void;
  selectedCrop: string | null;
  setSelectedCrop: (crop: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  cameraAllowed: boolean;
  setCameraAllowed: (val: boolean) => void;
  locationAllowed: boolean;
  setLocationAllowed: (val: boolean) => void;
  notifications: WeatherNotification[];
  addNotification: (n: WeatherNotification) => void;
  clearNotifications: () => void;
}

export interface WeatherNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationData | null>(() => {
    const saved = localStorage.getItem("tf_location");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedCrop, setSelectedCrop] = useState<string | null>(() => {
    return localStorage.getItem("tf_crop") || null;
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("tf_dark") === "true";
  });
  const [cameraAllowed, setCameraAllowed] = useState(() => {
    return localStorage.getItem("tf_camera") === "true";
  });
  const [locationAllowed, setLocationAllowed] = useState(() => {
    return localStorage.getItem("tf_location_perm") === "true";
  });
  const [notifications, setNotifications] = useState<WeatherNotification[]>(() => {
    const saved = localStorage.getItem("tf_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (location) localStorage.setItem("tf_location", JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    if (selectedCrop) localStorage.setItem("tf_crop", selectedCrop);
  }, [selectedCrop]);

  useEffect(() => {
    localStorage.setItem("tf_dark", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("tf_camera", String(cameraAllowed));
  }, [cameraAllowed]);

  useEffect(() => {
    localStorage.setItem("tf_location_perm", String(locationAllowed));
  }, [locationAllowed]);

  useEffect(() => {
    localStorage.setItem("tf_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const toggleDarkMode = () => setDarkMode((p) => !p);

  const addNotification = (n: WeatherNotification) => {
    setNotifications((prev) => [n, ...prev]);
  };

  const clearNotifications = () => setNotifications([]);

  return (
    <AppContext.Provider
      value={{
        location, setLocation,
        selectedCrop, setSelectedCrop,
        darkMode, toggleDarkMode,
        cameraAllowed, setCameraAllowed,
        locationAllowed, setLocationAllowed,
        notifications, addNotification, clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
