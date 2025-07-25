import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from '@/components/ui/use-toast';

const firebaseConfig = {
  apiKey: "AIzaSyC6XtUDmKv0aul-zUL3TRH1i2UxWtgCLU0",
  authDomain: "crowd-monitoring-e1f70.firebaseapp.com",
  projectId: "crowd-monitoring-e1f70",
  storageBucket: "crowd-monitoring-e1f70.firebasestorage.app",
  messagingSenderId: "1069463850395",
  appId: "1:1069463850395:web:f24d177297c60e0c50a53e",
  measurementId: "G-68VH97XQ6V"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

const recordStream = (stream, duration) => {
  return new Promise((resolve, reject) => {
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
    let timeout;

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      clearTimeout(timeout);
      const blob = new Blob(chunks, { type: 'video/mp4' });
      resolve(blob);
    };
    mediaRecorder.onerror = (e) => {
      clearTimeout(timeout);
      reject(e);
    };

    mediaRecorder.start();
    timeout = setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, duration);
  });
};

export const saveSOSAlertToFirestore = async (alertData) => {
  try {
    const docRef = await addDoc(collection(db, 'sos-alerts'), {
      ...alertData,
      createdAt: serverTimestamp()
    });

    console.log('SOS Alert saved to Firestore with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving SOS alert to Firestore:', error);
    throw new Error('Failed to save SOS alert to database');
  }
};

export const uploadVideoAndGetURL = async (stream, userId) => {
  if (!stream) {
    throw new Error("No video stream provided.");
  }
  
  const videoDurationMs = 5000; // 5 seconds as requested
  const videoBlob = await recordStream(stream, videoDurationMs);
  
  const videoFileName = `sos-videos/sos_${userId}_${Date.now()}.mp4`;
  const videoRef = ref(storage, videoFileName);

  try {
    const snapshot = await uploadBytes(videoRef, videoBlob);
    const videoUrl = await getDownloadURL(snapshot.ref);

    // Thumbnail generation is complex on the client-side.
    // For now, we'll return a placeholder or null.
    // A robust solution would involve a backend function (e.g., Firebase Cloud Function)
    // to generate a thumbnail after the video is uploaded.
    
    return {
      videoUrl,
      videoThumbnail: null, 
      videoDuration: Math.round(videoDurationMs / 1000),
    };
  } catch (error) {
    console.error("Error uploading video:", error);
    throw new Error("Failed to upload emergency video.");
  }
};
