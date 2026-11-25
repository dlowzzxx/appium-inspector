import {Button, ConfigProvider, Input, Row, Select, Space, Table} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {DRIVERS} from '../../../../constants/common.js';
import {
  NATIVE_APP,
  NATIVE_COMMON_LOCATOR_STRATEGY_MAP as COMMON_STRATEGIES,
  NATIVE_DRIVER_LOCATOR_STRATEGY_MAP as DRIVER_STRATEGIES,
  WEB_LOCATOR_STRATEGY_MAP as WEB_STRATEGIES,
} from '../../../../constants/session-inspector.js';
import {LOCATOR_GROUP_MODE} from '../../../../utils/locator-search.js';

import inspectorStyles from '../../SessionInspector.module.css';
import styles from './LocatorSearch.module.css';

const locatorStrategies = (automationName, currentContext) => {
  if (currentContext && currentContext !== NATIVE_APP) {
    return Object.values(WEB_STRATEGIES);
  }
  const strategies = Object.values(COMMON_STRATEGIES);
  switch (automationName) {
    case DRIVERS.XCUITEST:
    case DRIVERS.MAC2:
      strategies.push(DRIVER_STRATEGIES.PREDICATE, DRIVER_STRATEGIES.CLASS_CHAIN);
      break;
    case DRIVERS.UIAUTOMATOR2:
      strategies.push(DRIVER_STRATEGIES.UIAUTOMATOR);
      break;
    case DRIVERS.ESPRESSO:
      strategies.push(
        DRIVER_STRATEGIES.TEXT,
        DRIVER_STRATEGIES.DATAMATCHER,
        DRIVER_STRATEGIES.VIEWMATCHER,
        DRIVER_STRATEGIES.VIEWTAG,
      );
      break;
    case DRIVERS.WINCORE:
      strategies.push(DRIVER_STRATEGIES.WIN_UIAUTOMATION);
      break;
  }
  return strategies;
};

/**
 * Locator strategy selector for locator search.
 */
const LocatorSearchFormStrategySelector = ({
  automationName,
  currentContext,
  locatorSearchStrategy,
  setLocatorSearchStrategy,
}) => (
  <Row justify="center">
    {locatorStrategies(automationName, currentContext).map(([strategyValue, strategyName]) => (
      <Button
        type={strategyValue === locatorSearchStrategy ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        className={styles.locatorStrategyBtn}
        onClick={() => setLocatorSearchStrategy(strategyValue)}
        key={strategyValue}
      >
        {strategyName}
      </Button>
    ))}
  </Row>
);

/**
 * Selector input field for locator search.
 */
const LocatorSearchFormValueInputField = ({locatorSearchValue, setLocatorSearchValue, label}) => (
  <Input.TextArea
    className={styles.locatorSelectorTextArea}
    onChange={(e) => setLocatorSearchValue(e.target.value)}
    value={locatorSearchValue}
    aria-label={label}
    allowClear={true}
    rows={3}
  />
);

const LocatorGroupFields = ({strategies, locators, mode, setMode, updateLocator, removeLocator}) => {
  const {t} = useTranslation();
  const modeOptions = [
    {value: LOCATOR_GROUP_MODE.ALL, label: t('locatorGroupAll')},
    {value: LOCATOR_GROUP_MODE.ANY, label: t('locatorGroupAny')},
    {value: LOCATOR_GROUP_MODE.CHAIN, label: t('locatorGroupChain')},
  ];
  const strategyOptions = strategies.map(([value, label]) => ({value, label}));

  return (
    <Space orientation="vertical" className={inspectorStyles.spaceContainer}>
      {locators.map(({id, strategy, selector}, position) => (
        <div className={styles.locatorGroupRow} key={id}>
          <Select
            aria-label={t('locatorGroupStrategy', {number: position + 2})}
            value={strategy}
            options={strategyOptions}
            onChange={(value) => updateLocator(id, {strategy: value})}
          />
          <Input
            aria-label={t('locatorGroupSelector', {number: position + 2})}
            placeholder={t('selector')}
            value={selector}
            onChange={(event) => updateLocator(id, {selector: event.target.value})}
          />
          <Button onClick={() => removeLocator(id)} aria-label={t('locatorGroupRemove', {number: position + 2})}>
            {t('locatorGroupRemoveButton')}
          </Button>
        </div>
      ))}
      <Select aria-label={t('locatorGroupMode')} value={mode} options={modeOptions} onChange={setMode} />
    </Space>
  );
};

/**
 * Table listing previous locator strategy and selector searches.
 */
const LocatorSearchFormHistoryTable = ({
  searchHistory,
  locatorSearchStrategy,
  locatorSearchValue,
  setLocatorSearchStrategy,
  setLocatorSearchValue,
}) => {
  const selectedKey = JSON.stringify([locatorSearchStrategy, locatorSearchValue]);
  const columns = [
    {
      dataIndex: 'strategy',
    },
    {
      dataIndex: 'selector',
    },
  ];

  return (
    <Row>
      <Table
        pagination={false}
        className={styles.searchResultsList}
        dataSource={searchHistory}
        columns={columns}
        showHeader={false}
        onRow={(row) => ({
          onClick: () => {
            setLocatorSearchStrategy(row.strategy);
            setLocatorSearchValue(row.selector);
          },
        })}
        rowSelection={{
          selectedRowKeys: [selectedKey],
          hideSelectAll: true,
          columnWidth: 0,
          renderCell: () => null,
        }}
      />
    </Row>
  );
};

/**
 * Input form for locator search related data.
 */
const LocatorSearchForm = ({
  setLocatorSearchValue,
  locatorSearchValue,
  setLocatorSearchStrategy,
  locatorSearchStrategy,
  automationName,
  currentContext,
  searchHistory,
  showSearchHistory,
  extraLocators,
  addLocator,
  updateLocator,
  removeLocator,
  groupMode,
  setGroupMode,
  isSearchingForElements,
}) => {
  const {t} = useTranslation();

  return (
    <ConfigProvider componentDisabled={isSearchingForElements}>
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="small">
        {t('locatorStrategy')}
        <LocatorSearchFormStrategySelector
          automationName={automationName}
          currentContext={currentContext}
          locatorSearchStrategy={locatorSearchStrategy}
          setLocatorSearchStrategy={setLocatorSearchStrategy}
        />
        {t('selector')}
        <LocatorSearchFormValueInputField
          locatorSearchValue={locatorSearchValue}
          setLocatorSearchValue={setLocatorSearchValue}
          label={t('selector')}
        />
        {extraLocators.length > 0 && (
          <LocatorGroupFields
            strategies={locatorStrategies(automationName, currentContext)}
            locators={extraLocators}
            mode={groupMode}
            setMode={setGroupMode}
            updateLocator={updateLocator}
            removeLocator={removeLocator}
          />
        )}
        <Button onClick={addLocator}>{t('locatorGroupAdd')}</Button>
        {showSearchHistory && !isSearchingForElements && (
          <>
            {t('searchHistory')}
            <LocatorSearchFormHistoryTable
              searchHistory={searchHistory}
              locatorSearchStrategy={locatorSearchStrategy}
              locatorSearchValue={locatorSearchValue}
              setLocatorSearchStrategy={setLocatorSearchStrategy}
              setLocatorSearchValue={setLocatorSearchValue}
            />
          </>
        )}
      </Space>
    </ConfigProvider>
  );
};

export default LocatorSearchForm;
