// Firestore의 월간보고서 데이터 확인 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkReports() {
  try {
    console.log('월간보고서 확인 중...\n');

    const reportsSnapshot = await getDocs(collection(db, 'monthly_reports'));

    console.log(`총 ${reportsSnapshot.size}개의 월간보고서가 있습니다.\n`);

    if (reportsSnapshot.size > 0) {
      console.log('=== 월간보고서 목록 ===');
      reportsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   견명: ${data.dogName}`);
        console.log(`   퍼피티처: ${data.userName}`);
        console.log(`   userId: ${data.userId}`);
        console.log(`   보고월: ${data.reportMonth}`);
        console.log(`   상태: ${data.status}`);
        console.log(`   작성일: ${data.createdAt}`);
        console.log('\n   === 모든 필드 ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
      });
    } else {
      console.log('월간보고서가 하나도 없습니다.');
    }

    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

checkReports();
