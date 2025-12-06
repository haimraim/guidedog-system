/**
 * IndexedDB를 사용한 영상 파일 저장 유틸리티
 * 큰 용량의 영상 파일을 안정적으로 저장하기 위해 IndexedDB 사용
 */

const DB_NAME = 'GuideDogVideoDB';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

/**
 * IndexedDB 초기화 및 연결
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB를 열 수 없습니다.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object Store가 없으면 생성
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * 영상 파일을 IndexedDB에 저장
 * @param lectureId 강의 ID
 * @param videoBlob 영상 파일 (Blob 또는 File)
 * @returns Promise<void>
 */
export const saveVideoToIndexedDB = async (
  lectureId: string,
  videoBlob: Blob | File
): Promise<void> => {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(videoBlob, lectureId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('영상 저장에 실패했습니다.'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    throw new Error('영상 저장 중 오류가 발생했습니다: ' + (error as Error).message);
  }
};

/**
 * IndexedDB에서 영상 파일 가져오기
 * @param lectureId 강의 ID
 * @returns Promise<Blob | null> 영상 Blob 또는 null
 */
export const getVideoFromIndexedDB = async (
  lectureId: string
): Promise<Blob | null> => {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(lectureId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('영상 조회에 실패했습니다.'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('영상 조회 중 오류:', error);
    return null;
  }
};

/**
 * IndexedDB에서 영상 파일 삭제
 * @param lectureId 강의 ID
 * @returns Promise<void>
 */
export const deleteVideoFromIndexedDB = async (
  lectureId: string
): Promise<void> => {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(lectureId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('영상 삭제에 실패했습니다.'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('영상 삭제 중 오류:', error);
  }
};

/**
 * Blob을 Object URL로 변환
 * @param blob 영상 Blob
 * @returns Object URL
 */
export const createVideoObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

/**
 * Object URL 해제 (메모리 누수 방지)
 * @param url Object URL
 */
export const revokeVideoObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * 모든 영상 파일 삭제 (개발/테스트용)
 */
export const clearAllVideos = async (): Promise<void> => {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('영상 전체 삭제에 실패했습니다.'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('영상 전체 삭제 중 오류:', error);
  }
};
