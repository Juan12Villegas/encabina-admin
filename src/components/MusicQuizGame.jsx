"use client";
import { useState, useEffect } from "react";
import { Music, Volume2, Check, X } from "lucide-react";

const songQuiz = [
    {
        id: 1,
        lyrics: "Yo quiero bailar, toda la noche sin parar",
        options: ["Gasolina", "Danza Kuduro", "Despacito", "Bailando"],
        correct: "Gasolina",
        artist: "Daddy Yankee"
    },
    {
        id: 2,
        lyrics: "Suenan los tambores, la gente está bailando",
        options: ["La Gozadera", "Vivir Mi Vida", "La Vida Es Un Carnaval", "Felices los 4"],
        correct: "Vivir Mi Vida",
        artist: "Marc Anthony"
    },
    {
        id: 3,
        lyrics: "Dale mami, dale dale, esto sigue hasta el amanecer",
        options: ["Danza Kuduro", "Dura", "El Perdón", "Mi Gente"],
        correct: "Danza Kuduro",
        artist: "Don Omar"
    }
];

export const MusicQuizGame = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15);
    const [gameFinished, setGameFinished] = useState(false);

    useEffect(() => {
        if (gameStarted && !showResult && timeLeft > 0 && !gameFinished) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !showResult) {
            handleAnswer(null); // Tiempo terminado
        }
    }, [timeLeft, gameStarted, showResult, gameFinished]);

    const handleAnswer = (option) => {
        setSelectedOption(option);
        const correct = option === songQuiz[currentQuestion].correct;
        setIsCorrect(correct);
        if (correct) setScore(score + 1);
        setShowResult(true);
    };

    const nextQuestion = () => {
        if (currentQuestion < songQuiz.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setShowResult(false);
            setSelectedOption(null);
            setIsCorrect(null);
            setTimeLeft(15);
        } else {
            setGameFinished(true);
        }
    };

    const restartGame = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowResult(false);
        setSelectedOption(null);
        setIsCorrect(null);
        setGameStarted(false);
        setTimeLeft(15);
        setGameFinished(false);
    };

    if (!gameStarted) {
        return (
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 text-center max-w-md mx-auto">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Music className="text-indigo-600" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Adivina la Canción</h2>
                <p className="text-gray-600 mb-6">¿Podrás reconocer estas canciones por sus letras?</p>
                <button
                    onClick={() => setGameStarted(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                    Comenzar Juego
                </button>
            </div>
        );
    }

    if (gameFinished) {
        return (
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 text-center max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Juego Terminado!</h2>
                <p className="text-xl mb-2">Tu puntuación final:</p>
                <p className="text-4xl font-bold text-indigo-600 mb-6">{score}/{songQuiz.length}</p>
                <button
                    onClick={restartGame}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                    Jugar de Nuevo
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Volume2 className="text-indigo-600" />
                    <span className="font-medium text-gray-700">Pregunta {currentQuestion + 1}/{songQuiz.length}</span>
                </div>
                <div className="bg-white rounded-full px-3 py-1 text-sm font-medium">
                    ⏱️ {timeLeft}s
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                <p className="text-lg italic text-center text-gray-800 mb-2">"{songQuiz[currentQuestion].lyrics}"</p>
                <p className="text-sm text-center text-gray-500">Artista: {songQuiz[currentQuestion].artist}</p>
            </div>

            <div className="space-y-3 mb-6">
                {songQuiz[currentQuestion].options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => !showResult && handleAnswer(option)}
                        disabled={showResult}
                        className={`w-full text-left p-3 rounded-lg transition-all ${showResult
                            ? option === songQuiz[currentQuestion].correct
                                ? 'bg-green-100 border-2 border-green-500'
                                : selectedOption === option
                                    ? 'bg-red-100 border-2 border-red-500'
                                    : 'bg-gray-50'
                            : 'bg-white hover:bg-indigo-50 border border-gray-200'}`}
                    >
                        <div className="flex items-center">
                            {showResult && (
                                <span className="mr-2">
                                    {option === songQuiz[currentQuestion].correct ? (
                                        <Check className="text-green-500" size={18} />
                                    ) : selectedOption === option ? (
                                        <X className="text-red-500" size={18} />
                                    ) : null}
                                </span>
                            )}
                            {option}
                        </div>
                    </button>
                ))}
            </div>

            {showResult && (
                <div className={`p-3 rounded-lg mb-4 text-center ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isCorrect ? '¡Correcto! 🎉' : `Incorrecto. La respuesta era: ${songQuiz[currentQuestion].correct}`}
                </div>
            )}

            {showResult && (
                <button
                    onClick={nextQuestion}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    {currentQuestion < songQuiz.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultados'}
                </button>
            )}
        </div>
    );
};