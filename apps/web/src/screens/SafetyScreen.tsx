import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ROUTES } from '../routes';
import { clearFlow, getSafety, type SafetyDecision } from '../store';

const REASON: Partial<Record<SafetyDecision, string>> = {
  worried: '你刚才选择的是「我有一些担忧或不确定」，所以流程先停在这里。',
  stop: '你刚才选择的是「我现在不想继续」，所以流程先停在这里。',
};

export default function SafetyScreen() {
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const decision = getSafety();
    if (decision && REASON[decision]) setReason(REASON[decision] ?? null);
  }, []);

  function leave(href: string) {
    clearFlow();
    window.location.href = href;
  }

  return (
    <AppShell meta={ROUTES['/safety']}>
      <section className="sf-card">
        <div className="sf-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 21 19H3L12 3Zm0 7v4m0 3h.01" />
          </svg>
        </div>
        <h2 className="sf-h2">你的安全，比任何一件事都重要</h2>
        <p className="sf-copy">
          如果你担心继续记录会带来威胁、控制、报复或任何人身风险，请先停下来。这里不会逼你继续，也不会替你联系任何人。
        </p>

        {reason && <p className="sf-reason">{reason}</p>}

        <div className="sf-note">
          <strong>你可以这样做：</strong>
          <br />
          · 联系你信任的人，请他们陪你聊聊；
          <br />
          · 在你方便的时候，向当地可信的支持资源求助；
          <br />
          · 暂时离开这个流程，保存好已写的内容或直接删除。
          <br />
          <br />
          本产品不提供、也不编造任何热线号码。请自行核实当地可靠渠道。
        </div>

        <div className="sf-actions">
          <button type="button" className="sf-btn sf-btn-danger" onClick={() => leave('/')}>
            停止并回到首页
          </button>
          <button type="button" className="sf-btn sf-btn-quiet" onClick={() => leave('/event-start')}>
            我准备好后再继续
          </button>
        </div>

        <p className="app-footer-note">
          流程会停留在这里。「我准备好后再继续」将返回上一步并重新进行安全检查，不会沿用这次的结论。
        </p>
      </section>
    </AppShell>
  );
}
