import FormData from "form-data";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { audioURL } = req.body;

    try {
      const response = await fetch(audioURL);
      const audioBuffer = await response.buffer();

      const form = new FormData();
      form.append("file", audioBuffer, { filename: "audio.webm" });
      form.append("model", "whisper-1");

      const headers = {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      };

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/audio/translations",
        {
          method: "POST",
          headers: headers,
          body: form,
        }
      );

      const result = await openaiResponse.json();

      if (openaiResponse.ok) {
        console.log(result.text);
        res.status(200).json({ transcript: result.text });
      } else {
        console.error(result);
        res.status(500).json({ error: "Error transcribing the audio file" });
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      res.status(500).json({ error: "Error transcribing the audio file" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
