import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { generateFeedback } from './utils/gptApi';
import BottomMenu from './BottomMenu';
import Header from './components/Header';

// Mock data - replace with actual data later
const assignments = [
  { id: "1", name: "SAT Practice Test" },
  { id: "2", name: "Handwritten Essay" },
  { id: "3", name: "Typed Essay" },
];

const students = [
  { id: "1", name: "James L." },
  { id: "2", name: "Star D." },
  { id: "3", name: "Jack N." },
  { id: "4", name: "Emily R." },
  { id: "5", name: "Sophia T." },
  { id: "6", name: "Oliver P." },
  { id: "7", name: "Liam C." },
  { id: "8", name: "Emma W." },
];

export default function Feedback() {
  const router = useRouter();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileData = {
          name: file.name,
          uri: file.uri,
          type: file.mimeType,
          size: file.size
        };
        setSelectedFile(fileData);
      }
    } catch (err) {
      console.error("Error picking document:", err);
      setSelectedFile(null);
    }
  };

  const handleTakePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        alert("You need to enable camera permissions to take a picture.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        const fileData = {
          name: 'photo_' + new Date().getTime() + '.jpg',
          uri: photo.uri,
          type: 'image/jpeg',
          size: photo.fileSize || 0
        };
        setSelectedFile(fileData);
      }
    } catch (err) {
      console.error("Error taking picture:", err);
      alert("Failed to take picture. Please try again.");
    }
  };

  const processFile = async () => {
    if (!selectedAssignment || !selectedStudent || !selectedFile) {
      Alert.alert("Missing Information", "Please select an assignment, student, and file before generating feedback.");
      return;
    }

    setIsLoading(true);
    setProgressStatus('Processing...');
    try {
      const feedbackResponse = await generateFeedback(
        selectedFile,
        selectedStudent,
        selectedAssignment,
        (status) => setProgressStatus(status)
      );

      router.push({
        pathname: "/gptResponse",
        params: { 
          response: feedbackResponse,
          imageUri: selectedFile.uri 
        }
      });
    } catch (error) {
      console.error('Error:', error);
      setProgressStatus('Error generating feedback');
    } finally {
      setIsLoading(false);
      setProgressStatus('');
    }
  };

  const renderModal = (
    visible,
    setVisible,
    data,
    selectedValue,
    setSelectedValue,
    title
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setVisible(false)}
            >
              <Ionicons name="close" size={24} color="#4A5568" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedValue?.id === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedValue(item);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedValue?.id === item.id && styles.modalItemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
                {selectedValue?.id === item.id && (
                  <Ionicons name="checkmark" size={24} color="#6B46C1" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Feedback" />
      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Assignment Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Assignment</Text>
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => setShowAssignmentModal(true)}
          >
            <Text style={styles.selectionText}>
              {selectedAssignment ? selectedAssignment.name : "Select Assignment"}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#6B46C1" />
          </TouchableOpacity>
        </View>

        {/* Student Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Student</Text>
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => setShowStudentModal(true)}
          >
            <Text style={styles.selectionText}>
              {selectedStudent ? selectedStudent.name : "Select Student"}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#6B46C1" />
          </TouchableOpacity>
        </View>

        {/* File Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Student Work</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handleFilePick}>
            <Ionicons name="cloud-upload-outline" size={24} color="#6B46C1" />
            <Text style={styles.uploadText}>Upload File</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={handleTakePicture}>
            <Ionicons name="camera-outline" size={24} color="#6B46C1" />
            <Text style={styles.uploadText}>Take Picture</Text>
          </TouchableOpacity>
          <Text style={styles.fileNameText}>
            {selectedFile ? `Selected: ${selectedFile.name}` : "No file selected"}
          </Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!selectedAssignment || !selectedStudent || !selectedFile || isLoading) &&
              styles.generateButtonDisabled,
          ]}
          onPress={processFile}
          disabled={!selectedAssignment || !selectedStudent || !selectedFile || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Feedback</Text>
          )}
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{progressStatus}</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderModal(
        showAssignmentModal,
        setShowAssignmentModal,
        assignments,
        selectedAssignment,
        setSelectedAssignment,
        "Select Assignment"
      )}
      {renderModal(
        showStudentModal,
        setShowStudentModal,
        students,
        selectedStudent,
        setSelectedStudent,
        "Select Student"
      )}

      {/* Bottom Menu */}
      <BottomMenu router={router} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 12,
  },
  selectionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectionText: {
    fontSize: 16,
    color: "#4A5568",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
    marginBottom: 8,
    backgroundColor: "#F7FAFC",
  },
  uploadText: {
    color: "#6B46C1",
    marginLeft: 8,
  },
  fileNameText: {
    marginTop: 8,
    fontSize: 14,
    color: "#4A5568",
    textAlign: "center",
  },
  generateButton: {
    backgroundColor: "#6B46C1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  generateButtonDisabled: {
    backgroundColor: "#A0AEC0",
  },
  generateButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3748",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalItemSelected: {
    backgroundColor: "#F7FAFC",
  },
  modalItemText: {
    fontSize: 16,
    color: "#4A5568",
  },
  modalItemTextSelected: {
    color: "#6B46C1",
    fontWeight: "600",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
});
