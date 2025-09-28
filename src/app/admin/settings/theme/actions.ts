
"use server";

import * as fs from 'fs/promises';
import * as path from 'path';

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateTheme(
  formData: FormData
): Promise<FormState> {
  
  try {
    const primary = formData.get("primary") as string;
    const accent = formData.get("accent") as string;
    const background = formData.get("background") as string;
    const foreground = formData.get("foreground") as string;
    const destructive = formData.get("destructive") as string;
    
    if (!primary || !accent || !background || !foreground || !destructive) {
        return { success: false, error: "All color fields are required." };
    }

    const cssFilePath = path.join(process.cwd(), 'src', 'app', 'globals.css');
    let cssContent = await fs.readFile(cssFilePath, 'utf8');

    const updateCssVariable = (content: string, variable: string, value: string): string => {
        const regex = new RegExp(`(${variable}:\\s*)[\\d\\s.%]+;`);
        if (regex.test(content)) {
            return content.replace(regex, `$1${value};`);
        }
        return content; // Return original if variable not found
    };

    cssContent = updateCssVariable(cssContent, '--primary', primary);
    cssContent = updateCssVariable(cssContent, '--accent', accent);
    cssContent = updateCssVariable(cssContent, '--background', background);
    cssContent = updateCssVariable(cssContent, '--foreground', foreground);
    cssContent = updateCssVariable(cssContent, '--destructive', destructive);
    
    await fs.writeFile(cssFilePath, cssContent, 'utf8');
    
    // Revalidating the path won't work for CSS files in Next.js development.
    // The browser's cache needs to be busted, which typically requires a full page reload
    // or more advanced cache-busting strategies. For this prototype, a manual refresh is okay.
    // revalidatePath("/", "layout");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating theme:", error);
    return {
      success: false,
      error: `Failed to write to CSS file: ${error}`,
    };
  }
}
