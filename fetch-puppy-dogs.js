// 실제 퍼피티칭 안내견 목록 확인 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function fetchPuppyTeachingDogs() {
  try {
    console.log('퍼피티칭 안내견 목록 조회 중...\n');

    // 모든 안내견 가져오기
    const dogsSnapshot = await getDocs(collection(db, 'dogs'));

    console.log(`총 ${dogsSnapshot.size}개의 안내견이 등록되어 있습니다.\n`);

    // 퍼피티칭 카테고리 필터링
    const puppyDogs = [];
    dogsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category === '퍼피티칭') {
        puppyDogs.push({
          id: doc.id,
          name: data.name,
          puppyTeacherName: data.puppyTeacherName,
          category: data.category
        });
      }
    });

    console.log(`퍼피티칭 카테고리: ${puppyDogs.length}마리\n`);

    if (puppyDogs.length > 0) {
      console.log('=== 퍼피티칭 안내견 목록 ===');
      puppyDogs.forEach((dog, index) => {
        console.log(`${index + 1}. 견명: ${dog.name}, 퍼피티처: ${dog.puppyTeacherName || '미지정'}`);
      });
    } else {
      console.log('퍼피티칭 카테고리의 안내견이 없습니다.');
    }

    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

fetchPuppyTeachingDogs();
