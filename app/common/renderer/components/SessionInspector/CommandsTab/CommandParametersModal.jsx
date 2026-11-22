import {AutoComplete, Input, Modal, Space, Typography} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {isEmpty} from '../../../utils/common.js';

import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

const formatParamInputLabel = (param) => {
  const monoName = <span className={inspectorStyles.monoFont}>{param.name}</span>;
  if (param.required) {
    return (
      <>
        <Typography.Text type="danger">*</Typography.Text>&nbsp;{monoName}
      </>
    );
  }
  return monoName;
};

const WindowHandleInput = ({executeDriverCommand, onChange}) => {
  const {t} = useTranslation();
  const [handles, setHandles] = useState(null);

  useEffect(() => {
    let active = true;
    const loadHandles = async () => {
      try {
        const {commandRes} = await executeDriverCommand({methodName: 'getWindowHandles'});
        if (active) {
          setHandles(Array.isArray(commandRes) ? commandRes : []);
        }
      } catch {
        // Some drivers can switch windows without implementing window enumeration.
        if (active) {
          setHandles([]);
        }
      }
    };
    void loadHandles();
    return () => {
      active = false;
    };
  }, [executeDriverCommand]);

  return (
    <AutoComplete
      aria-label={t('windowHandle')}
      placeholder={handles === null ? t('loadingWindowHandles') : t('selectOrEnterWindowHandle')}
      options={(handles ?? []).map((handle) => ({value: handle}))}
      onChange={onChange}
      style={{flex: 1, minWidth: 0}}
    />
  );
};

/**
 * Modal for entering command parameters.
 */
const CommandParametersModal = ({
  curCommandDetails,
  curCommandParamValsRef,
  executeDriverCommand,
  prepareAndRunCommand,
  clearCurrentCommand,
}) => {
  const {t} = useTranslation();

  return (
    <Modal
      title={t('enterMethodParameters', {methodName: curCommandDetails.name})}
      okText={t('Execute Command')}
      open={!isEmpty(curCommandDetails.details.params)}
      onOk={() => prepareAndRunCommand(curCommandDetails)}
      onCancel={() => clearCurrentCommand()}
      footer={(_, {OkBtn}) => <OkBtn />}
    >
      {(curCommandDetails.details.params ?? []).map((param, index) => (
        <Space.Compact block key={param.name} className={styles.commandArgInputRow}>
          <Space.Addon>{formatParamInputLabel(param)}</Space.Addon>
          {!curCommandDetails.isExecute && curCommandDetails.name === 'switchToWindow' && param.name === 'handle' ? (
            <WindowHandleInput
              executeDriverCommand={executeDriverCommand}
              onChange={(value) => (curCommandParamValsRef.current[index] = value)}
            />
          ) : (
            <Input onChange={(e) => (curCommandParamValsRef.current[index] = e.target.value)} />
          )}
        </Space.Compact>
      ))}
    </Modal>
  );
};

export default CommandParametersModal;
