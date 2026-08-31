"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import { X, FileText, CheckCircle2 } from "lucide-react";

interface SyllabusPdfGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  subjectName: string;
}

interface ParsedUnit {
  title: string;
  subtitle: string;
  content: string;
}

export default function SyllabusPdfGeneratorModal({
  open,
  onClose,
  subjectName,
}: SyllabusPdfGeneratorModalProps) {
  const [text, setText] = useState("");
  const [parsedUnits, setParsedUnits] = useState<ParsedUnit[]>([]);
  const [error, setError] = useState("");
  const [localSubjectName, setLocalSubjectName] = useState(
    subjectName || ""
  );

  React.useEffect(() => {
    if (open) {
      setLocalSubjectName(subjectName || "");
      setError("");
      setParsedUnits([]);
    }
  }, [open, subjectName]);

  if (!open) return null;

  /**
   * Detect:
   *
   * UNIT I
   * UNIT-I
   * UNIT - I
   * UNIT – I
   * UNIT 1
   * MODULE I
   * CHAPTER 1
   *
   * The important part is that the regex is NOT line-dependent.
   * This allows pasted text that is entirely on one line to work.
   */
  const unitRegex =
    /\b(UNIT|MODULE|CHAPTER)\s*(?:[-–—_:]\s*)?([IVXLCDM]+|[0-9]+)\b/gi;

  const normalizeText = (value: string) => {
    return value
      // Decode common HTML non-breaking-space entity.
      .replace(/&#x20;|&#32;|&nbsp;/gi, " ")

      // Normalize CRLF / CR.
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")

      // Normalize unusual spaces.
      .replace(/\u00a0/g, " ")

      // Normalize tabs.
      .replace(/\t/g, " ")

      // Collapse excessive spaces while preserving newlines.
      .replace(/[ ]{2,}/g, " ")

      // Clean excessive blank lines.
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")

      .trim();
  };

  /**
   * Extract the heading from the beginning of a unit block.
   *
   * Examples:
   *
   * UNIT I WEB SITE BASICS AND HTML
   *
   * becomes:
   *
   * title    = UNIT I
   * subtitle = WEB SITE BASICS AND HTML
   *
   * Also supports:
   *
   * UNIT I - WEB SITE BASICS AND HTML
   * UNIT I – WEB SITE BASICS AND HTML
   * UNIT I: WEB SITE BASICS AND HTML
   *
   * If the heading is on its own next line:
   *
   * UNIT I
   * WEB SITE BASICS AND HTML
   * Web Essentials...
   *
   * it also works.
   */
  const extractUnitHeader = (
    block: string,
    type: string,
    number: string
  ) => {
    const title = `${type.toUpperCase()} ${number.toUpperCase()}`;

    let remaining = block;

    // Remove the detected UNIT/MODULE/CHAPTER part.
    const headerMatch = remaining.match(
      new RegExp(
        `^\\s*${type}\\s*(?:[-–—_:]\\s*)?${number}\\b`,
        "i"
      )
    );

    if (headerMatch) {
      remaining = remaining.slice(headerMatch[0].length).trim();
    }

    remaining = remaining.replace(/^[\s:–—-]+/, "").trim();

    if (!remaining) {
      return {
        title,
        subtitle: "",
        content: "",
      };
    }

    let subtitle = "";
    let content = remaining;

    /*
     * Case 1:
     *
     * UNIT I
     * WEB SITE BASICS AND HTML
     * Web Essentials...
     *
     * The first line is treated as the heading.
     */
    const lines = remaining.split("\n");

    if (lines.length >= 2) {
      const firstLine = lines[0].trim();
      const secondLine = lines[1].trim();

      if (
        firstLine &&
        secondLine &&
        firstLine.length <= 120 &&
        !firstLine.endsWith(".")
      ) {
        subtitle = firstLine;
        content = lines.slice(1).join("\n").trim();

        return {
          title,
          subtitle,
          content,
        };
      }
    }

    /*
     * Case 2:
     *
     * UNIT I WEB SITE BASICS AND HTML
     * Web Essentials...
     *
     * Since the input may be completely on one line, we need
     * a conservative way to identify the heading.
     *
     * We look for the first obvious content separator.
     */
    const separators = [
      /\s+(?=Web Essentials\s*:)/i,
      /\s+(?=Style Sheets\s*:)/i,
      /\s+(?=Client-Side Programming\s*:)/i,
      /\s+(?=Host Objects\s*:)/i,
      /\s+(?=Server-Side Programming\s*:)/i,
      /\s+(?=Separating Programming and Presentation\s*:)/i,
      /\s+(?=Representing Web Data\s*:)/i,
      /\s+(?=AJAX\s*:)/i,
      /\s+(?=Web Services\s*:)/i,
    ];

    for (const separator of separators) {
      const match = remaining.match(separator);

      if (match && match.index !== undefined) {
        const possibleSubtitle = remaining
          .slice(0, match.index)
          .trim();

        const possibleContent = remaining
          .slice(match.index)
          .trim();

        if (
          possibleSubtitle &&
          possibleSubtitle.length <= 120 &&
          possibleContent
        ) {
          subtitle = possibleSubtitle;
          content = possibleContent;

          return {
            title,
            subtitle,
            content,
          };
        }
      }
    }

    /*
     * Case 3:
     *
     * UNIT I - WEB SITE BASICS AND HTML
     *
     * If there is a dash/colon immediately after the unit number,
     * everything until the first sentence-like content is treated
     * as the heading.
     *
     * This is intentionally conservative.
     */
    const headingMatch = remaining.match(
      /^(.{2,120}?)(?=\.\s+|:\s+|\n|$)/
    );

    if (headingMatch) {
      const possibleSubtitle = headingMatch[1].trim();

      if (
        possibleSubtitle &&
        possibleSubtitle.length <= 120 &&
        !possibleSubtitle.includes("Web Essentials")
      ) {
        subtitle = possibleSubtitle;
        content = remaining
          .slice(headingMatch[0].length)
          .replace(/^[\s.:–—-]+/, "")
          .trim();
      }
    }

    return {
      title,
      subtitle,
      content,
    };
  };

  const handleParse = () => {
    setError("");

    if (!text.trim()) {
      setError("Please paste some syllabus text first.");
      return;
    }

    const cleanText = normalizeText(text);

    const matches = [...cleanText.matchAll(unitRegex)];

    if (matches.length === 0) {
      setError(
        "Could not detect any units. Please ensure the syllabus contains UNIT I, UNIT II, etc."
      );
      return;
    }

    const units: ParsedUnit[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];

      if (match.index === undefined) continue;

      const start = match.index;

      const end =
        i + 1 < matches.length
          ? matches[i + 1].index!
          : cleanText.length;

      const block = cleanText.slice(start, end).trim();

      const type = match[1];
      const number = match[2];

      const parsed = extractUnitHeader(
        block,
        type,
        number
      );

      units.push(parsed);
    }

    /*
     * Remove accidental empty units.
     */
    const validUnits = units.filter(
      (unit) =>
        unit.title &&
        (unit.subtitle || unit.content)
    );

    if (validUnits.length === 0) {
      setError("Units were detected, but no syllabus content was found.");
      return;
    }

    setParsedUnits(validUnits);
  };

  const handleGeneratePDF = () => {
    if (parsedUnits.length === 0) return;

    const doc = new jsPDF();

    const finalSubjectName =
      localSubjectName.trim() ||
      subjectName ||
      "Subject";

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginLeft = 16;
    const marginRight = 16;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPos = 20;

    /*
     * Main title
     */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);

    doc.text(
      `${finalSubjectName} - Syllabus`,
      marginLeft,
      yPos
    );

    yPos += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      "Generated by UpGradez",
      marginLeft,
      yPos
    );

    yPos += 10;

    parsedUnits.forEach((unit, index) => {
      /*
       * Estimate required space before starting a new unit.
       * Large content can still naturally flow across pages.
       */
      if (yPos > pageHeight - 35) {
        doc.addPage();
        yPos = 20;
      }

      /*
       * UNIT I
       */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);

      doc.text(
        unit.title,
        marginLeft,
        yPos
      );

      yPos += 7;

      /*
       * WEB SITE BASICS AND HTML
       */
      if (unit.subtitle) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);

        const subtitleLines = doc.splitTextToSize(
          unit.subtitle,
          contentWidth
        );

        doc.text(
          subtitleLines,
          marginLeft,
          yPos
        );

        yPos += subtitleLines.length * 5 + 4;
      }

      /*
       * Entire unit content.
       *
       * IMPORTANT:
       * We don't split this into individual topics.
       */
      if (unit.content) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);

        const contentLines = doc.splitTextToSize(
          unit.content,
          contentWidth
        );

        const lineHeight = 5;

        for (const line of contentLines) {
          if (yPos > pageHeight - 18) {
            doc.addPage();
            yPos = 20;
          }

          doc.text(
            line,
            marginLeft,
            yPos
          );

          yPos += lineHeight;
        }
      }

      /*
       * Space before next unit.
       */
      yPos += 10;

      /*
       * Small separator.
       */
      if (index < parsedUnits.length - 1) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        doc.setDrawColor(180, 180, 180);

        doc.line(
          marginLeft,
          yPos,
          pageWidth - marginRight,
          yPos
        );

        yPos += 8;
      }
    });

    const fileName = `${finalSubjectName.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    )}_Syllabus.pdf`;

    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E] shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2C] px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#8C8C8A]" />

            <h2 className="text-[15px] font-medium text-[#ECECEA]">
              Generate PDF from Text
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-[#8C8C8A] hover:text-[#ECECEA]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {parsedUnits.length === 0 ? (
            <div className="flex flex-col gap-4">

              {/* Subject */}
              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#ECECEA]">
                  Subject Name
                </label>

                <input
                  type="text"
                  value={localSubjectName}
                  onChange={(e) =>
                    setLocalSubjectName(e.target.value)
                  }
                  placeholder="e.g. Web Technology"
                  className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
                />
              </div>

              {/* Syllabus */}
              <div className="flex flex-col gap-2">

                <label className="text-[13px] font-medium text-[#ECECEA]">
                  Syllabus Content
                </label>

                <p className="text-[12px] text-[#8C8C8A]">
                  Paste the complete syllabus. Units such as{" "}
                  <b>UNIT I</b>, <b>UNIT II</b>,{" "}
                  <b>MODULE 1</b>, or <b>CHAPTER 1</b>{" "}
                  will be detected automatically.
                </p>

                <textarea
                  value={text}
                  onChange={(e) =>
                    setText(e.target.value)
                  }
                  placeholder={`UNIT I WEB SITE BASICS AND HTML
Web Essentials: Clients, Servers, and Communication...

UNIT II CSS AND CLIENT SIDE SCRIPTING
Style Sheets: CSS-Introduction to Cascading Style Sheets...`}
                  className="h-72 w-full resize-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] p-3 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
                />

                {error && (
                  <p className="text-[12px] text-red-400">
                    {error}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* Success */}
              <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-[13px] text-green-400">
                <CheckCircle2 size={16} />

                <span>
                  Successfully parsed {parsedUnits.length} units.
                </span>
              </div>

              {/* Preview */}
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">

                {parsedUnits.map((unit, index) => (
                  <div
                    key={`${unit.title}-${index}`}
                    className="rounded-lg border border-[#3A3A38] bg-[#2C2C2A] p-5"
                  >

                    {/* Unit */}
                    <div className="mb-1 text-[14px] font-bold uppercase tracking-wide text-[#ECECEA]">
                      {unit.title}
                    </div>

                    {/* Unit Heading */}
                    {unit.subtitle && (
                      <div className="mb-4 text-[15px] font-semibold text-[#B0B0AE]">
                        {unit.subtitle}
                      </div>
                    )}

                    {/* Entire content */}
                    {unit.content && (
                      <div className="whitespace-pre-wrap text-[13px] leading-6 text-[#ECECEA]">
                        {unit.content}
                      </div>
                    )}
                  </div>
                ))}

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#2E2E2C] px-5 py-4">

          <button
            onClick={() => {
              if (parsedUnits.length > 0) {
                setParsedUnits([]);
              } else {
                onClose();
              }
            }}
            className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] transition-colors hover:bg-[#2C2C2A]"
          >
            {parsedUnits.length > 0
              ? "Edit Text"
              : "Cancel"}
          </button>

          {parsedUnits.length === 0 ? (
            <button
              onClick={handleParse}
              className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
            >
              Preview PDF
            </button>
          ) : (
            <button
              onClick={handleGeneratePDF}
              className="rounded-md bg-[#ECECEA] px-4 py-2 text-[13px] font-medium text-[#1C1C1B] transition-colors hover:bg-white"
            >
              Download PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}