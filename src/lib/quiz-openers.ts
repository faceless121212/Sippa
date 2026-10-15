import "server-only";
import type { CategoryId } from "@/config/categories";
import { quizScene, quizzes, VIBES, type Vibe } from "@/config/quizzes";
import { segmentForCategory } from "@/config/segments";
import openers from "@/data/quiz-openers.json";

/**
 * The scene and first message a visitor picked in the quiz, looked up from ids only
 * (the ids come from the URL / cookie, so nothing else from them is trusted).
 */
export function quizChatStart(characterId: string, category: CategoryId, sceneId?: string | null, vibe?: string | null) {
  const segment = segmentForCategory(category);
  const scene = quizScene(segment, sceneId ?? undefined);
  if (!scene?.scene || !VIBES.includes(vibe as Vibe)) return null;
  const opener = (openers as Record<string, Record<string, Record<Vibe, string>>>)[characterId]?.[scene.id]?.[vibe as Vibe];
  if (!opener) return null;
  const vibeLabel = quizzes[segment].vibes[vibe as Vibe].toLowerCase();
  return {
    sceneId: scene.id,
    vibe: vibe as Vibe,
    label: scene.label,
    opener,
    /** Sent to the character as the chat's scene. */
    prompt: `${scene.label}: ${scene.scene} The user picked this scene in the Sippa quiz and asked for a ${vibeLabel} tone than usual — keep that tone.`,
  };
}
