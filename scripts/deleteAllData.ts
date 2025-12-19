/**
 * 개인정보 보호를 위한 데이터 전체 삭제 스크립트
 * 삭제 대상: 월간보고서, 보딩폼, 진료기록, 약품 체크
 */

import { initializeApp } from 'firebase/app';
import { collection, getDocs, deleteDoc, doc, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFpZyTGYzi2N8SrK8JmWJi-iSRSZZ0NHk",
  authDomain: "guidedogsystem.firebaseapp.com",
  projectId: "guidedogsystem",
  storageBucket: "guidedogsystem.firebasestorage.app",
  messagingSenderId: "757099883206",
  appId: "1:757099883206:web:dfd3a2e290594e1106c5c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS_TO_DELETE = [
  'monthly_reports',    // 월간보고서
  'boarding_forms',     // 보딩폼
  'medical_records',    // 진료기록
  'medication_checks',  // 약품 체크
];

async function deleteAllDocuments(collectionName: string): Promise<number> {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);

  let count = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnapshot.id));
    count++;
  }

  return count;
}

async function main() {
  console.log('=== 데이터 삭제 시작 ===\n');

  for (const collectionName of COLLECTIONS_TO_DELETE) {
    try {
      const count = await deleteAllDocuments(collectionName);
      console.log(`✓ ${collectionName}: ${count}개 문서 삭제 완료`);
    } catch (error) {
      console.error(`✗ ${collectionName}: 삭제 실패`, error);
    }
  }

  console.log('\n=== 데이터 삭제 완료 ===');
  console.log('\n※ localStorage도 정리하려면 브라우저에서 다음 키를 삭제하세요:');
  console.log('  - guidedog_monthly_reports');
  console.log('  - guidedog_boarding_forms');
  console.log('  - guidedog_medical');
  console.log('  - guidedog_medication');

  process.exit(0);
}

main();
