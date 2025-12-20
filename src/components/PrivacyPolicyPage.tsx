/**
 * 개인정보 처리방침 페이지
 */

export const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">개인정보 처리방침</h1>

      <div className="space-y-6 text-neutral-700">
        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">1. 처리하는 개인정보 항목</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold mb-2">필수정보</h3>
              <p>이름, 연락처, 주소(도로명, 지번), 이메일, 휴대폰번호, 회원ID, 생년월일, 나이, 성별</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">민감정보</h3>
              <p>안내견 관련 신청 시 견종, 체격, 질병, 장애정도, 동물질병정보 등을 수집합니다.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">2. 개인정보의 보유 및 이용기간</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>안내견 신청: 신청 후 10년 보관</li>
            <li>반려견 신청: 신청 후 20년 보관</li>
            <li>자원봉사자: 활동 종료 후 20년 이내</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">3. 개인정보의 처리 목적</h2>
          <p>안내견 양성, 반려견 교육, 자원봉사 관리 등 사회공헌 사업 운영을 위해 개인정보를 처리합니다.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">4. 개인정보의 제3자 제공</h2>
          <p>법령에 명시된 경우를 제외하고는 제3자에게 개인정보를 제공하지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">5. 개인정보의 기술적 보안조치</h2>
          <p>웹사이트는 암호화, 백신, 방화벽을 설치하여 개인정보를 보호하고 있습니다.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">6. 개인정보의 삭제</h2>
          <p>사용자는 언제든지 Mydog 홈페이지에서 회원탈퇴 후 정보 삭제를 신청할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">7. 개인정보 보호책임자</h2>
          <div className="bg-neutral-50 p-4 rounded">
            <p><strong>개인정보보호담당자:</strong> 정하선</p>
            <p><strong>이메일:</strong> infosecu.sei@samsung.com</p>
          </div>
        </section>

        <section className="mt-8 pt-6 border-t border-neutral-300">
          <p className="text-sm text-neutral-600">
            본 개인정보 처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 시에는
            시행하기 최소 7일 전에 홈페이지를 통해 변경사유 및 내용 등을 공지하도록 하겠습니다.
          </p>
          <p className="text-sm text-neutral-600 mt-2">
            <strong>시행일자:</strong> 2025년 1월 1일
          </p>
        </section>
      </div>
    </div>
  );
};
