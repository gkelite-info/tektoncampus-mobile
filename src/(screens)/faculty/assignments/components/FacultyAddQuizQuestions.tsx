import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CaretLeft, PlusCircle, Trash, CheckCircle } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';

import { fetchQuizById, updateQuizStatus } from '@/lib/helpers/quiz/quizAPI';
import { saveQuizQuestion } from '@/lib/helpers/quiz/quizQuestionAPI';
import { saveBulkOptions } from '@/lib/helpers/quiz/quizQuestionOptionAPI';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  title: string;
  type: "Multiple Choice" | "Fill in the Blanks";
  options: Option[];
  correctAnswer: string;
}

interface FacultyAddQuizQuestionsProps {
  onBack: () => void;
  onSaved: (status: 'Draft' | 'Active') => void;
  quizId: number;
}

export default function FacultyAddQuizQuestions({
  onBack,
  onSaved,
  quizId,
}: FacultyAddQuizQuestionsProps) {
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: Date.now(),
      title: "",
      type: "Multiple Choice",
      correctAnswer: "",
      options: [
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false },
        { id: 4, text: "", isCorrect: false },
      ],
    },
  ]);

  const [quizDetails, setQuizDetails] = useState<{
    quizTitle: string;
    topicTitle: string;
    maxQuestions: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    setIsLoading(true);
    fetchQuizById(quizId)
      .then((data) => {
        setQuizDetails({
          quizTitle: data.quizTitle,
          topicTitle: data.college_subject_unit_topics?.topicTitle || "General Topic",
          maxQuestions: data.questionsCount || 0,
        });
      })
      .catch(() => Toast.show({ type: "error", text1: "Failed to fetch quiz details" }))
      .finally(() => setIsLoading(false));
  }, [quizId]);

  const addQuestion = () => {
    if (quizDetails && questions.length >= quizDetails.maxQuestions) {
      Toast.show({ type: 'error', text1: `You can only add up to ${quizDetails.maxQuestions} questions.` });
      return;
    }

    const lastType = questions[questions.length - 1]?.type || "Multiple Choice";
    const newQuestion: Question = {
      id: Date.now(),
      title: "",
      type: lastType,
      correctAnswer: "",
      options: [
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false },
        { id: 4, text: "", isCorrect: false },
      ],
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const isQuestionEmpty = (q: Question) => {
    const hasTitle = q.title.trim().length > 0;
    const hasOptions = q.options.some((o) => o.text.trim().length > 0);
    const hasAnswer = q.correctAnswer.trim().length > 0;
    return !(hasTitle || hasOptions || hasAnswer);
  };

  const deleteQuestion = (id: number) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    if (isQuestionEmpty(question)) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      return;
    }
    setDeleteQuestionId(id);
  };

  const confirmDeleteQuestion = () => {
    if (!deleteQuestionId) return;
    setQuestions((prev) => prev.filter((q) => q.id !== deleteQuestionId));
    setDeleteQuestionId(null);
  };

  const updateQuestionTitle = (id: number, title: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, title } : q)));
  };

  const updateQuestionType = (id: number, type: Question["type"]) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, type } : q)));
  };

  const updateOptionText = (qId: number, optId: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
            }
          : q
      )
    );
  };

  const setCorrectOption = (qId: number, optId: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                isCorrect: o.id === optId,
              })),
            }
          : q
      )
    );
  };

  const addOption = (qId: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: [...q.options, { id: Date.now(), text: "", isCorrect: false }],
            }
          : q
      )
    );
  };

  const handleSave = async (status: "Draft" | "Active") => {
    if (!quizId) {
      Toast.show({ type: "error", text1: "Quiz ID not found" });
      return;
    }

    for (const q of questions) {
      if (!q.title.trim()) {
        Toast.show({ type: "error", text1: "All questions must have a title" });
        return;
      }
      if (q.type === "Multiple Choice") {
        const hasCorrect = q.options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          Toast.show({ type: "error", text1: `Please mark a correct answer for: "${q.title}"` });
          return;
        }
      }
      if (q.type === "Fill in the Blanks" && !q.correctAnswer.trim()) {
        Toast.show({ type: "error", text1: `Please enter correct answer for: "${q.title}"` });
        return;
      }
    }

    const isComplete = quizDetails && questions.length === quizDetails.maxQuestions;
    const finalStatus = (status === "Active" && isComplete) ? "Active" : "Draft";

    if (status === "Active" && !isComplete) {
      Toast.show({ type: "info", text1: `You need ${quizDetails?.maxQuestions} questions to publish. Saving as Draft.` });
    }

    try {
      if (status === "Active") setIsSaving(true);
      else setIsDrafting(true);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qResult = await saveQuizQuestion({
          quizId,
          questionText: q.title,
          questionType: q.type,
          marks: 1,
          displayOrder: i,
        });

        if (!qResult.success || !qResult.questionId) {
          throw new Error(`Failed to save question: ${q.title}`);
        }

        if (q.type === "Multiple Choice") {
          await saveBulkOptions(
            qResult.questionId,
            q.options.map((o, idx) => ({
              optionText: o.text,
              isCorrect: o.isCorrect,
              displayOrder: idx,
            }))
          );
        } else {
          await saveBulkOptions(qResult.questionId, [
            {
              optionText: q.correctAnswer.trim(),
              isCorrect: true,
              displayOrder: 0,
            },
          ]);
        }
      }

      const statusResult = await updateQuizStatus(quizId, finalStatus);
      if (!statusResult.success) throw new Error("Failed to update status");

      Toast.show({
        type: "success",
        text1: finalStatus === "Active" ? "Quiz published successfully!" : "Quiz saved as draft!"
      });
      onSaved(finalStatus);
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message || "Something went wrong" });
    } finally {
      setIsSaving(false);
      setIsDrafting(false);
    }
  };

  const hasMultipleChoice = questions.some((q) => q.type === "Multiple Choice");
  const isMaxReached = quizDetails && questions.length >= quizDetails.maxQuestions;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-[#F4F4F4]">
        <ActivityIndicator size="large" color="#43C17A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F4F4F4]">
      {}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center gap-3 shadow-sm z-10 pt-4">
        <TouchableOpacity onPress={onBack} className="p-1 rounded-full bg-gray-100">
          <CaretLeft size={24} weight="bold" color="#16284F" />
        </TouchableOpacity>
        <View className="flex-1 pr-4">
          <Text className="text-xl font-bold text-[#16284F]" numberOfLines={1}>Add Questions</Text>
          <Text className="text-xs text-gray-500">Create quiz questions for students</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {}
        <View className="bg-white rounded-xl px-4 py-3 mb-4 min-h-[60px] flex-row items-center justify-between border-2 border-[#43C17A]">
          <View className="flex-col flex-1 pr-2">
            <Text className="font-bold text-[#282828] text-sm" numberOfLines={1}>{quizDetails?.quizTitle}</Text>
            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>{quizDetails?.topicTitle}</Text>
          </View>
          <View className="items-end shrink-0">
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Added</Text>
            <Text className={`text-xl font-black ${isMaxReached ? 'text-[#43C17A]' : 'text-[#16284F]'}`}>
              {questions.length} <Text className="text-gray-300 text-sm font-medium">/ {quizDetails?.maxQuestions}</Text>
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1 pr-2">
            {hasMultipleChoice && (
              <View className="bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-md">
                <Text className="text-blue-500 text-[10px] font-medium leading-tight">
                  * Note: Select the correct answer via radio button.
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={addQuestion}
            disabled={!!isMaxReached}
            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-md ${isMaxReached ? 'bg-gray-300' : 'bg-[#43C17A]'}`}
          >
            <PlusCircle size={16} color="white" weight="fill" />
            <Text className="text-white text-xs font-bold">Add Question</Text>
          </TouchableOpacity>
        </View>

        {}
        <View className="flex-col gap-4 pb-12">
          {questions.map((question, index) => (
            <View key={question.id} className={`bg-white rounded-xl p-4 shadow-sm border ${index === 0 ? "border-[#43C17A]" : "border-gray-100"}`}>
              {}
              <View className="flex-col gap-3 mb-4">
                <View className="border border-gray-200 rounded-md bg-white overflow-hidden">
                  <Picker
                    selectedValue={question.type}
                    onValueChange={(val) => updateQuestionType(question.id, val as any)}
                    style={{ height: 50 }}
                  >
                    <Picker.Item label="Multiple Choice" value="Multiple Choice" />
                    <Picker.Item label="Fill in the Blanks" value="Fill in the Blanks" />
                  </Picker>
                </View>

                <TextInput
                  value={question.title}
                  onChangeText={(val) => updateQuestionTitle(question.id, val)}
                  placeholder={`Question ${index + 1}`}
                  multiline
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#282828] min-h-[50px] textAlignVertical-top"
                />
              </View>

              {}
              <View className="flex-col gap-2 mb-2">
                {question.type === "Multiple Choice" ? (
                  question.options.map((option, optIdx) => (
                    <View key={option.id} className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => setCorrectOption(question.id, option.id)}
                        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${option.isCorrect ? 'border-[#43C17A] bg-[#43C17A]' : 'border-gray-300'}`}
                      >
                        {option.isCorrect && <CheckCircle size={12} color="white" weight="fill" />}
                      </TouchableOpacity>
                      <TextInput
                        value={option.text}
                        placeholder={`Option ${optIdx + 1}`}
                        onChangeText={(val) => updateOptionText(question.id, option.id, val)}
                        className={`flex-1 border-b py-1.5 text-sm text-[#282828] ${option.isCorrect ? 'border-[#43C17A] bg-[#43C17A]/5' : 'border-gray-200'}`}
                      />
                    </View>
                  ))
                ) : (
                  <View className="flex-col gap-3 mt-1">
                    <View className="bg-amber-50/50 border border-amber-100 rounded-md p-2">
                      <Text className="text-[10px] text-amber-700 leading-tight">
                        💡 Tip: Use underscores (___) in the question title to indicate where the blank appears.
                      </Text>
                    </View>
                    <View className="bg-[#43C17A]/5 border border-[#43C17A]/20 rounded-lg p-3">
                      <Text className="text-xs font-bold text-[#205B3A] mb-1">Correct Answer</Text>
                      <TextInput
                        value={question.correctAnswer}
                        onChangeText={(val) => setQuestions((prev) => prev.map((q) => q.id === question.id ? { ...q, correctAnswer: val } : q))}
                        placeholder="Exact text for the blank..."
                        className="w-full bg-white border border-[#43C17A]/40 rounded-md px-3 py-2 text-sm text-[#282828]"
                      />
                    </View>
                  </View>
                )}
              </View>

              {}
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                {question.type === "Multiple Choice" ? (
                  <TouchableOpacity onPress={() => addOption(question.id)} className="px-2 py-1 bg-blue-50 rounded">
                    <Text className="text-blue-600 text-xs font-bold">Add Option</Text>
                  </TouchableOpacity>
                ) : <View />}
                
                <TouchableOpacity onPress={() => deleteQuestion(question.id)} className="p-1.5 bg-red-50 rounded-full">
                  <Trash size={16} color="#EF4444" weight="bold" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {}
      <View className="bg-white border-t border-gray-200 p-4 flex-row justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <TouchableOpacity
          onPress={() => handleSave("Draft")}
          disabled={isDrafting}
          className="flex-1 py-3 rounded-lg border border-[#16284F] items-center justify-center bg-white"
        >
          {isDrafting ? <ActivityIndicator size="small" color="#16284F" /> : <Text className="text-[#16284F] text-sm font-bold">Save Draft</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSave("Active")}
          disabled={isSaving}
          className="flex-1 py-3 rounded-lg bg-[#43C17A] items-center justify-center"
        >
          {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-sm font-bold">Publish Quiz</Text>}
        </TouchableOpacity>
      </View>

      <ConfirmDeleteModal
        open={!!deleteQuestionId}
        isDeleting={false}
        name="question"
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteQuestionId(null)}
      />
    </View>
  );
}
