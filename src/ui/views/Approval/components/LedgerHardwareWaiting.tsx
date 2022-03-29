import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import ReactGA from 'react-ga';
import { Account } from 'background/service/preference';
import {
  CHAINS,
  WALLETCONNECT_STATUS_MAP,
  EVENTS,
  KEYRING_CLASS,
} from 'consts';
import { useApproval, useWallet, openInTab } from 'ui/utils';
import eventBus from '@/eventBus';
import { SvgIconOpenExternal } from 'ui/assets';

interface ApprovalParams {
  address: string;
  chainId?: number;
  isGnosis?: boolean;
  data?: string[];
  account?: Account;
}

const LedgerHardwareWaiting = ({ params }: { params: ApprovalParams }) => {
  const wallet = useWallet();
  const statusHeaders = {
    [WALLETCONNECT_STATUS_MAP.WAITING]: {
      color: '#8697FF',
      content: 'Please Sign on Your Ledger',
      image: '/images/ledger-status/plug.jpg',
    },
    [WALLETCONNECT_STATUS_MAP.SIBMITTED]: {
      content: 'Transaction submitted',
      color: '#27C193',
      desc: 'Your transaction has been submitted',
      image: '/images/ledger-status/success.jpg',
    },
    [WALLETCONNECT_STATUS_MAP.FAILD]: {
      content: 'Transaction rejected',
      color: '#EC5151',
      image: '/images/ledger-status/failed.jpg',
    },
  };
  const [connectStatus, setConnectStatus] = useState(
    WALLETCONNECT_STATUS_MAP.WAITING
  );
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const chain = Object.values(CHAINS).find(
    (item) => item.id === (params.chainId || 1)
  )!;
  const { t } = useTranslation();
  const [isSignText, setIsSignText] = useState(false);
  const [result, setResult] = useState('');

  const handleCancel = () => {
    rejectApproval('user cancel');
  };

  const handleOK = () => {
    window.close();
  };

  const handleRetry = async () => {
    const account = await wallet.syncGetCurrentAccount()!;
    setConnectStatus(WALLETCONNECT_STATUS_MAP.WAITING);
    await wallet.requestKeyring(account.type, 'resend');
  };

  const handleClickResult = () => {
    const url = chain.scanLink.replace(/_s_/, result);
    openInTab(url);
  };

  const init = async () => {
    const approval = await getApproval();
    setIsSignText(params.isGnosis ? true : approval?.approvalType !== 'SignTx');
    eventBus.addEventListener(EVENTS.LEDGER.REJECTED, async () => {
      setConnectStatus(WALLETCONNECT_STATUS_MAP.FAILD);
    });
    eventBus.addEventListener(EVENTS.SIGN_FINISHED, async (data) => {
      if (data.success) {
        setConnectStatus(WALLETCONNECT_STATUS_MAP.SIBMITTED);
        setResult(data.data);
        ReactGA.event({
          category: 'Transaction',
          action: 'Submit',
          label: KEYRING_CLASS.HARDWARE.LEDGER,
        });
        resolveApproval(data.data, !isSignText);
      } else {
        setConnectStatus(WALLETCONNECT_STATUS_MAP.FAILD);
      }
    });
  };

  useEffect(() => {
    init();
  }, []);
  const currentHeader = statusHeaders[connectStatus];

  return (
    <div className="ledger-waiting">
      <img
        src="/images/ledger-status/header.jpg"
        className="ledger-waiting__nav"
      />
      <div className="ledger-waiting__container">
        <div className="ledger-waiting__header">
          <h1
            style={{
              color: currentHeader.color,
              marginBottom: `${currentHeader.desc ? '8px' : '70px'}`,
            }}
          >
            {currentHeader.content}
          </h1>
          {currentHeader.desc && <p>{currentHeader.desc}</p>}
        </div>
        <img src={currentHeader.image} className="ledger-waiting__status" />
        {connectStatus === WALLETCONNECT_STATUS_MAP.WAITING && (
          <div className="ledger-waiting__tip">
            <p>Make sure:</p>
            <p>1. Plug your Ledger wallet into your computer</p>
            <p>2. Unlock Ledger and open the Ethereum app</p>
            <p className="ledger-waiting__tip-resend">
              Don't see the transaction on Ledger?{' '}
              <span className="underline cursor-pointer" onClick={handleRetry}>
                Resend transaction
              </span>
            </p>
          </div>
        )}
        {connectStatus === WALLETCONNECT_STATUS_MAP.SIBMITTED && !isSignText && (
          <div className="ledger-waiting__result">
            <img className="icon icon-chain" src={chain.logo} />
            <a
              href="javascript:;"
              className="tx-hash"
              onClick={handleClickResult}
            >
              {`${result.slice(0, 6)}...${result.slice(-4)}`}
              <SvgIconOpenExternal className="icon icon-external" />
            </a>
          </div>
        )}
        {(connectStatus === WALLETCONNECT_STATUS_MAP.SIBMITTED ||
          connectStatus === WALLETCONNECT_STATUS_MAP.FAILD) && (
          <div
            className="ledger-waiting__footer"
            style={{
              marginTop: `${
                connectStatus === WALLETCONNECT_STATUS_MAP.SIBMITTED
                  ? '55px'
                  : '120px'
              }`,
            }}
          >
            {connectStatus === WALLETCONNECT_STATUS_MAP.SIBMITTED && (
              <Button
                className="w-[200px]"
                type="primary"
                size="large"
                onClick={handleOK}
              >
                OK
              </Button>
            )}
            {connectStatus === WALLETCONNECT_STATUS_MAP.FAILD && (
              <>
                <Button
                  className="w-[200px]"
                  type="primary"
                  size="large"
                  onClick={handleRetry}
                >
                  Retry
                </Button>
                <Button type="link" onClick={handleCancel}>
                  {t('Cancel')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerHardwareWaiting;