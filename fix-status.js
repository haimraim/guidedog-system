// 기존 월간보고서에 status 필드 추가 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function fixStatus() {
  try {
    console.log('월간보고서 status 필드 수정 중...\n');

    const reportsSnapshot = await getDocs(collection(db, 'monthly_reports'));

    console.log(`총 ${reportsSnapshot.size}개의 월간보고서를 확인합니다.\n`);

    let updated = 0;
    for (const reportDoc of reportsSnapshot.docs) {
      const data = reportDoc.data();

      if (!data.status) {
        console.log(`수정 중: ${data.dogName}_${data.userName} (ID: ${reportDoc.id})`);
        await updateDoc(doc(db, 'monthly_reports', reportDoc.id), {
          status: 'draft' // 기본값을 draft로 설정
        });
        console.log('✓ status를 draft로 설정했습니다.\n');
        updated++;
      } else {
        console.log(`스킵: ${data.dogName}_${data.userName} (이미 status가 있음: ${data.status})\n`);
      }
    }

    console.log(`\n완료! ${updated}개의 보고서를 업데이트했습니다.`);
    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

fixStatus();
