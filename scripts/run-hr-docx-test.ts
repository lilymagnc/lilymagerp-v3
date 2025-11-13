import { JSDOM } from 'jsdom';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
} from 'docx';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectDocumentTypeFromFileName, parseDocxFile } from '../src/lib/hr-docx-parser';

declare global {
  // eslint-disable-next-line no-var
  var DOMParser: typeof window.DOMParser;
}

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.DOMParser = window.DOMParser;

const createTableRow = (label: string, value: string) =>
  new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [new TextRun({ text: value })],
          }),
        ],
      }),
    ],
  });

const createSampleDoc = (type: '휴직원' | '퇴직원' | '휴가원') => {
  const infoRows: Array<[string, string]> = [
    ['소속', '영업팀'],
    ['직위', '대리'],
    ['성명', '홍길동'],
  ];

  const contentRows: Array<[string, string]> = [];

  if (type === '휴직원') {
    contentRows.push(
      ['휴직 기간', '2025-01-01 ~ 2025-06-30'],
      ['사유', '가족 돌봄'],
      ['휴직 중 비상연락처', '010-1234-5678'],
      ['업무 인수인계자', '김대리']
    );
  } else if (type === '퇴직원') {
    infoRows.push(['입사일', '2020-03-01']);
    contentRows.push(
      ['퇴직 예정일', '2025-02-28'],
      ['사유', '개인 사정']
    );
  } else {
    contentRows.push(
      ['휴가 종류', '연차'],
      ['휴가 기간', '2025-05-01 ~ 2025-05-05'],
      ['사유', '가족 여행'],
      ['휴가 중 비상연락처', '010-9876-5432']
    );
  }

  const document = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: type, spacing: { after: 200 }, heading: 'TITLE' as any }),
          new Paragraph({ text: '신청인 정보', spacing: { before: 200, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: infoRows.map(([label, value]) => createTableRow(label, value)),
          }),
          new Paragraph({ text: `${type === '퇴직원' ? '사직' : type === '휴가원' ? '휴가' : '휴직'} 신청 내용`, spacing: { before: 200, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: contentRows.map(([label, value]) => createTableRow(label, value)),
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(document);
};

const saveBufferAsFile = async (buffer: Buffer, fileName: string) => {
  const tempPath = join(tmpdir(), fileName);
  await writeFile(tempPath, buffer);
  return new File([buffer], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
};

const runTest = async (type: '휴직원' | '퇴직원' | '휴가원') => {
  const buffer = await createSampleDoc(type);
  const file = await saveBufferAsFile(buffer, `${type}_테스트.docx`);
  const fallbackType = detectDocumentTypeFromFileName(file.name);
  const parsed = await parseDocxFile(file, fallbackType);
  return parsed;
};

(async () => {
  const leaveResult = await runTest('휴직원');
  const resignationResult = await runTest('퇴직원');
  const vacationResult = await runTest('휴가원');

  console.log('휴직원 파싱 결과:', leaveResult);
  console.log('퇴직원 파싱 결과:', resignationResult);
  console.log('휴가원 파싱 결과:', vacationResult);
})();
