import { PixoraDocument } from '../types/document';
import { validatePixoraProject } from '../schema/validation';

export async function importPixoraFile(file: File): Promise<PixoraDocument> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.pixora') && !file.name.endsWith('.json')) {
      return reject(
        new Error(
          'Unable to open this project.\nPlease select a valid .pixora project file.'
        )
      );
    }

    const reader = new FileReader();

    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          return reject(
            new Error(
              'Unable to open this project.\nThe file contains invalid or corrupted JSON data.'
            )
          );
        }

        const validation = validatePixoraProject(json);
        if (!validation.success || !validation.document) {
          return reject(new Error(validation.error || 'Unable to open this project.'));
        }

        resolve(validation.document);
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to read project file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Unable to read the selected file from disk.'));
    };

    reader.readAsText(file);
  });
}
