import { useState } from "react";
import { generateGeminiResponse } from "../integrations/gemini";
import { speakText } from "../integrations/azureTts";

export default function MockInterview() {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  const jobRoles = [
    "Software Engineer",
    "Product Manager",
    "Data Analyst",
    "Marketing Manager",
    "Sales Executive",
    "HR Professional"
  ];

  const difficulties = ["Easy", "Medium", "Hard"];
  const interviewTypes = ["Behavioral", "Technical", "Situational", "General"];

  const handleGenerate = async () => {
    if (!selectedRole || !selectedDifficulty || !selectedType) {
      setError("Please select all options before generating a question.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const prompt = `Generate one ${selectedDifficulty.toLowerCase()} ${selectedType.toLowerCase()} interview question for a ${selectedRole} position. Make it realistic and appropriate for the difficulty level.`;
      
      console.log("Generating question with prompt:", prompt);
      const q = await generateGeminiResponse(prompt);
      
      if (!q || q.trim() === "") {
        throw new Error("Empty question received from Gemini");
      }
      
      setQuestion(q);
      console.log("Question generated:", q);
      
      // Speak the question aloud
      setSpeaking(true);
      try {
        await speakText(q);
      } catch (ttsError) {
        console.error("TTS Error:", ttsError);
        setError("Question generated but audio playback failed. Check console for details.");
      } finally {
        setSpeaking(false);
      }
      
    } catch (err) {
      console.error("Error in handleGenerate:", err);
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error occurred"}`);
      setQuestion("");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!question) return;
    
    setSpeaking(true);
    setError("");
    
    try {
      await speakText(question);
    } catch (err) {
      console.error("Error speaking question:", err);
      setError("Failed to play audio. Check console for details.");
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Mock Interview</h2>

      {/* Job Role Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Select Job Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobRoles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedRole === role
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white hover:border-pink-300"
              }`}
            >
              <div className="text-pink-500 text-4xl mb-2">💼</div>
              <div className="font-medium">{role}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Level Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Difficulty Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedDifficulty === difficulty
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white hover:border-pink-300"
              }`}
            >
              <div className="text-lg font-medium">{difficulty}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Interview Type Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Interview Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviewTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedType === type
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white hover:border-pink-300"
              }`}
            >
              <div className="text-lg font-medium">{type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <div className="text-center mb-6">
        <button
          onClick={handleGenerate}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          disabled={loading || speaking || !selectedRole || !selectedDifficulty || !selectedType}
        >
          {loading ? "Generating Question..." : speaking ? "Speaking..." : "Generate Question"}
        </button>
      </div>

      {/* Display Question */}
      {question && (
        <div className="mt-6 p-6 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-lg">Question:</h4>
            <button
              onClick={handleSpeak}
              disabled={speaking}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {speaking ? "🔊 Speaking..." : "🔊 Speak Again"}
            </button>
          </div>
          <p className="text-gray-800">{question}</p>
        </div>
      )}
    </div>
  );
}