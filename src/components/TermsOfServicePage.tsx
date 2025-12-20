/**
 * 이용약관 페이지
 */

export const TermsOfServicePage = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">이용약관</h1>

      <div className="space-y-6 text-neutral-700">
        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제1장 서비스 이용</h2>
          <div className="space-y-3">
            <p>
              본 서비스는 본 회사가 제공하는 guide dog 관련 종합 정보 서비스입니다.
            </p>
            <div className="bg-neutral-50 p-4 rounded">
              <h3 className="font-semibold mb-2">회원이 제공해야 하는 정보</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>회원 ID</li>
                <li>비밀번호</li>
                <li>이메일 주소</li>
              </ul>
            </div>
            <p>
              서비스 이용은 회원가입을 필요로 하며, 회원가입 시 제공된 정보는 정확해야 합니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제2장 회원가입 및 관리</h2>
          <div className="space-y-3">
            <p>
              <strong>회원의 책임:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>회원은 정확한 정보를 제공해야 하며, ID와 비밀번호 관리에 대한 책임이 있습니다.</li>
              <li>회원은 자신의 ID를 제3자와 공유할 수 없습니다.</li>
              <li>회원정보 변경 시 즉시 수정해야 합니다.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제3장 서비스 이용 제한</h2>
          <p className="mb-3">
            회사는 다음의 경우 서비스 이용을 제한할 수 있습니다:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>다른 회원의 정보를 도용하여 가입하는 경우</li>
            <li>음란물, 폭력 콘텐츠를 게시하는 경우</li>
            <li>타인의 저작권을 침해하는 경우</li>
            <li>법령을 위반하는 행위를 하는 경우</li>
            <li>공공질서 및 미풍양속을 해치는 행위를 하는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제4장 회사의 의무</h2>
          <div className="space-y-3">
            <p>
              회사는 관계 법령과 본 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며,
              지속적이고 안정적인 서비스 제공을 위해 노력합니다.
            </p>
            <p>
              회사는 회원의 개인정보를 보호하기 위해 보안시스템을 구축하고 개인정보취급방침을
              공시하고 준수합니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제5장 회원의 의무</h2>
          <p className="mb-3">
            회원은 다음 행위를 하여서는 안 됩니다:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>회원가입 신청 또는 변경 시 허위내용 등록</li>
            <li>타인의 정보 도용</li>
            <li>회사가 게시한 정보의 변경</li>
            <li>회사가 정한 정보 이외의 정보 등의 송신 또는 게시</li>
            <li>회사 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
            <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
            <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제6장 콘텐츠 관련 규정</h2>
          <div className="space-y-3">
            <p>
              회사는 회원이 게시하거나 전달하는 서비스 내의 내용물에 대해 책임을 지지 않습니다.
            </p>
            <p>
              회원은 커뮤니티 이용 시 타인을 모욕하거나 명예를 훼손하는 행위를 하여서는 안 됩니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제7장 서비스 이용 시간</h2>
          <p>
            서비스의 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간을
            원칙으로 합니다. 다만, 정기점검 등의 필요로 회사가 정한 날이나 시간은 예외로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제8장 손해배상</h2>
          <p>
            회사는 무료로 제공되는 서비스와 관련하여 회원에게 어떠한 손해가 발생하더라도
            회사가 고의로 행한 범죄행위를 제외하고는 이에 대하여 책임을 부담하지 아니합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제9장 분쟁의 해결</h2>
          <p>
            회사는 회원으로부터 제출되는 불만사항 및 의견을 우선적으로 처리합니다.
            다만, 신속한 처리가 곤란한 경우에는 회원에게 그 사유와 처리일정을 통보합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">제10장 재판권 및 준거법</h2>
          <p>
            본 약관은 대한민국 법률에 따라 규율되고 해석됩니다. 회사와 회원 간에 발생한 분쟁으로
            소송이 제기되는 경우에는 법령에 정한 절차에 따른 법원을 관할 법원으로 합니다.
          </p>
        </section>

        <section className="mt-8 pt-6 border-t border-neutral-300">
          <p className="text-sm text-neutral-600">
            본 약관은 2004년 7월 8일부터 적용됩니다.
          </p>
          <p className="text-sm text-neutral-600 mt-2">
            본 약관의 내용 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일 전부터 홈페이지의
            공지사항을 통해 고지할 것입니다.
          </p>
        </section>
      </div>
    </div>
  );
};
