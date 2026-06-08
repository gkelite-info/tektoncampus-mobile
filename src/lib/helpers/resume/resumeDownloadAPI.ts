import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message";

export async function generateResumePdf(html: string, fileName: string = "Resume.pdf"): Promise<void> {
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });

    // Rename the file so it exports with the correct name
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.copyAsync({
      from: uri,
      to: newUri
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(newUri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Resume PDF",
        UTI: "com.adobe.pdf"
      });
    } else {
      Toast.show({ type: "error", text1: "Sharing not available on this device" });
    }
  } catch (error) {
    console.error("PDF Generation error:", error);
    Toast.show({ type: "error", text1: "Failed to generate PDF" });
    throw error;
  }
}