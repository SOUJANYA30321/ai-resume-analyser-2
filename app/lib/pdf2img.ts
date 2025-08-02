// app/lib/pdf2img.ts
export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    if (typeof window === "undefined") {
        return {
            imageUrl: "",
            file: null,
            error: "PDF conversion can only be done in the browser.",
        };
    }

    try {
        const pdfjsLib = await import("pdfjs-dist");
        const workerSrc = await import("pdfjs-dist/build/pdf.worker.min?url");
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context!, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            );
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}
