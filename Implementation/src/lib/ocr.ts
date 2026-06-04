import { createWorker } from 'tesseract.js';

export const scanImageOCR = async (imageUri: string): Promise<string> => {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageUri);
  await worker.terminate();
  return text;
};