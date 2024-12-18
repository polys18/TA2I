import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Audio } from 'expo-av';
import * as Google from 'expo-auth-session/providers/google';

const { width } = Dimensions.get("window");

const onboardingPages = [
  { id: "1", icon: "robot", title: "Hi, I'm TA²I, your AI Teaching Assistant!", description: "" },
  {
    id: "2",
    icon: "archive-check-outline",
    title: "Give Feedback",
    description: "Give Feedback lets you create, customize, and submit feedback using AI.",
  },
  {
    id: "3",
    icon: "file-document-outline",
    title: "Rubrics",
    description: "Rubrics lets you view and edit the rubric or answer key for any active assignments.",
  },
  {
    id: "4",
    icon: "account-group-outline",
    title: "Students",
    description: "Easily view progress and provide feedback for enrolled students.",
  },
  {
    id: "5",
    icon: "cog-outline",
    title: "Settings",
    description: "Visit Settings to link your Canvas, GradeScope, Google Classroom, or other accounts!",
  },
  {
    id: "6",
    icon: "magnify",
    title: "Assignment Hub",
    description: "Create targeted assessments for your students with full control.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sound, setSound] = useState(null);
  const flatListRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [typedText, setTypedText] = useState("");

  // Direct Redirect URI for Expo
  const redirectUri = "https://auth.expo.io/@abhidesai/edtech-app";
  

  // Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "407963117970-mqgsrlfafsk7tb7lemadm0d9qetovdj9.apps.googleusercontent.com",
    redirectUri, // Directly set the redirect URI here
    scopes: ["openid", "profile", "email"], // Fixed Scopes
  });

  useEffect(() => {
    if (response) {
      console.log("Google Sign-In Response:", response);
      if (response?.type === "success") {
        const { id_token } = response.params;
        console.log("ID Token:", id_token);
      } else if (response?.type === "error") {
        console.error("Error Response:", response);
      }
    }
  }, [response]);
  

  const playSound = async () => {
    const { sound: newSound } = await Audio.Sound.createAsync(
      require("../../assets/robot.wav")
    );
    await newSound.playAsync();
    setSound(newSound);
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  useEffect(() => {
    playSound();
    return () => stopSound();
  }, []);

  useEffect(() => {
    if (currentIndex === 0) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 2, useNativeDriver: true }).start();
      const text = onboardingPages[0].title;
      let index = 0;
      const interval = setInterval(() => {
        setTypedText((prev) => {
          if (index < text.length) {
            return prev + text[index++];
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < onboardingPages.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleOnboardingComplete();
    }
  };

  const handleOnboardingComplete = () => {
    stopSound();
    router.push("/classes");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={onboardingPages}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.iconContainer}>
              {item.id === "1" ? (
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <MaterialCommunityIcons name={item.icon} size={120} color="#6B46C1" />
                </Animated.View>
              ) : (
                <MaterialCommunityIcons name={item.icon} size={120} color="#6B46C1" />
              )}
            </View>
            <Text style={styles.title}>{item.id === "1" ? typedText : item.title}</Text>
            {item.id !== "1" && <Text style={styles.description}>{item.description}</Text>}
            {item.id === "1" && (
              <>
                <TouchableOpacity
                  style={[styles.signInButton, styles.googleButton, { marginTop: 150 }]}
                  onPress={() => promptAsync()}
                >
                  <MaterialCommunityIcons name="google" size={24} color="#6B46C1" />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signInButton, styles.loginButton, { marginTop: 10, width: 200 }]}
                  onPress={() => handleNext()}
                >
                  <Text style={styles.loginButtonText}>Log In</Text>
                </TouchableOpacity>
              </>
            )}
            {item.id !== "1" && (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentIndex === onboardingPages.length - 1 ? "Get Started" : "Next"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        ref={flatListRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 16, color: "#2D3748", textAlign: "center", marginTop: 10 },
  signInButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 5, width: 200 },
  googleButton: { backgroundColor: "#fff", borderColor: "#6B46C1", borderWidth: 1 },
  googleButtonText: { color: "#6B46C1", fontWeight: "bold", marginLeft: 10 },
  loginButton: { backgroundColor: "#6B46C1", borderColor: "#6B46C1", borderWidth: 1 },
  loginButtonText: { color: "#fff", fontWeight: "bold" },
  page: { width, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  iconContainer: { width: 200, height: 200, backgroundColor: "#F7FAFC", borderRadius: 100, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  description: { fontSize: 16, color: "#4A5568", textAlign: "center", lineHeight: 24 },
  nextButton: { backgroundColor: "#6B46C1", padding: 15, borderRadius: 8, marginTop: 20, width: "95%", alignSelf: "center", position: "absolute", bottom: 40 },
  nextButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: 18 },
});
