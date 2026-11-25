import {IconClockX, IconHistory} from '@tabler/icons-react';
import {Button, Col, Modal, Row, Space, Tooltip} from 'antd';
import {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {LOCATOR_SEARCH_HISTORY} from '../../../../../shared/setting-defs.js';
import {BUTTON} from '../../../../constants/antd-types.js';
import {getSetting, setSetting} from '../../../../polyfills.js';
import {addLocatorSearchHistoryEntry, LOCATOR_GROUP_MODE} from '../../../../utils/locator-search.js';
import LocatorSearchEmptyResults from './LocatorSearchEmptyResults.jsx';
import LocatorSearchForm from './LocatorSearchForm.jsx';
import LocatorSearchFoundResults from './LocatorSearchFoundResults.jsx';

import styles from './LocatorSearch.module.css';

let retrievedSearchHistory = await getSetting(LOCATOR_SEARCH_HISTORY);

/**
 * Footer buttons of the modal used for locator search.
 */
const LocatorSearchModalFooter = ({
  locatedElements,
  isSearchingForElements,
  clearSearchResults,
  onSubmit,
  searchHistory,
  showSearchHistory,
  setShowSearchHistory,
  clearSearchHistory,
  searchDisabled,
}) => {
  const {t} = useTranslation();
  const toggleHistoryLabel = t('toggleSearchHistory');
  const clearHistoryLabel = t('clearSearchHistory');
  const submitLabel = locatedElements ? t('Done') : t('Search');

  return (
    <Row>
      <Col span={12}>
        {!locatedElements && (
          <Space.Compact>
            <Tooltip title={toggleHistoryLabel}>
              <Button
                aria-label={toggleHistoryLabel}
                id="btnToggleSearchHistory"
                icon={<IconHistory size={18} />}
                disabled={isSearchingForElements || !searchHistory.length}
                type={showSearchHistory ? BUTTON.PRIMARY : BUTTON.DEFAULT}
                onClick={() => setShowSearchHistory(!showSearchHistory)}
              />
            </Tooltip>
            <Tooltip title={clearHistoryLabel}>
              <Button
                aria-label={clearHistoryLabel}
                id="btnClearSearchHistory"
                icon={<IconClockX size={18} />}
                disabled={isSearchingForElements || !searchHistory.length}
                onClick={clearSearchHistory}
              />
            </Tooltip>
          </Space.Compact>
        )}
      </Col>
      <Col span={12} className={styles.searchModalFooterRightCol}>
        {locatedElements && <Button onClick={(e) => e.preventDefault() || clearSearchResults()}>{t('Back')}</Button>}
        <Button
          aria-label={submitLabel}
          disabled={searchDisabled || isSearchingForElements}
          loading={isSearchingForElements}
          onClick={onSubmit}
          type={BUTTON.PRIMARY}
        >
          {submitLabel}
        </Button>
      </Col>
    </Row>
  );
};

/**
 * Modal container used for locator search.
 */
const LocatorSearchModal = (props) => {
  const {
    isLocatorSearchModalVisible,
    isSearchingForElements,
    clearSearchResults,
    setLocatorSearchStrategy,
    setLocatorSearchValue,
    locatedElements,
    locatorSearchStrategy,
    locatorSearchValue,
    searchForElement,
    searchForLocatorGroup,
    featureCaps,
    sessionSettings,
    currentContext,
  } = props;
  const {t} = useTranslation();

  const [searchHistory, setSearchHistory] = useState(retrievedSearchHistory);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [extraLocators, setExtraLocators] = useState([]);
  const [groupMode, setGroupMode] = useState(LOCATOR_GROUP_MODE.ALL);
  const nextLocatorId = useRef(0);
  const grouped = extraLocators.length > 0;
  const locators = [{strategy: locatorSearchStrategy, selector: locatorSearchValue}, ...extraLocators];
  const searchDisabled =
    !locatedElements && grouped && locators.some(({strategy, selector}) => !strategy || !selector.trim());

  const addLocator = () => {
    const id = nextLocatorId.current++;
    setExtraLocators((previous) => [...previous, {id, strategy: locatorSearchStrategy, selector: ''}]);
  };
  const updateLocator = (id, change) => {
    setExtraLocators((previous) => previous.map((locator) => (locator.id === id ? {...locator, ...change} : locator)));
  };
  const removeLocator = (id) => {
    setExtraLocators((previous) => previous.filter((locator) => locator.id !== id));
  };

  const updateSearchHistory = async (updatedHistory) => {
    setSearchHistory(updatedHistory);
    // New sessions remount this component without reloading the module.
    retrievedSearchHistory = updatedHistory;
    await setSetting(LOCATOR_SEARCH_HISTORY, updatedHistory);
  };

  const clearSearchHistory = async () => {
    setShowSearchHistory(false);
    await updateSearchHistory([]);
  };

  const onCancel = () => {
    const {hideLocatorSearchModal} = props;
    setShowSearchHistory(false);
    setExtraLocators([]);
    setGroupMode(LOCATOR_GROUP_MODE.ALL);
    hideLocatorSearchModal();
    clearSearchResults();
  };

  const onSubmit = async () => {
    if (locatedElements) {
      onCancel();
    } else if (grouped) {
      await searchForLocatorGroup(
        locators.map(({strategy, selector}) => ({strategy, selector})),
        groupMode,
      );
    } else {
      const updatedHistory = addLocatorSearchHistoryEntry(searchHistory, {
        strategy: locatorSearchStrategy,
        selector: locatorSearchValue,
      });
      await updateSearchHistory(updatedHistory);
      searchForElement(locatorSearchStrategy, locatorSearchValue);
    }
  };

  return (
    <Modal
      open={isLocatorSearchModalVisible}
      title={t('Search for element')}
      className={styles.searchModal}
      onCancel={onCancel}
      closable={!isSearchingForElements}
      keyboard={!isSearchingForElements}
      mask={{closable: !isSearchingForElements}}
      footer={
        <LocatorSearchModalFooter
          locatedElements={locatedElements}
          isSearchingForElements={isSearchingForElements}
          clearSearchResults={clearSearchResults}
          onSubmit={onSubmit}
          searchHistory={searchHistory}
          showSearchHistory={showSearchHistory}
          setShowSearchHistory={setShowSearchHistory}
          clearSearchHistory={clearSearchHistory}
          searchDisabled={searchDisabled}
        />
      }
    >
      {!locatedElements && (
        <LocatorSearchForm
          setLocatorSearchValue={setLocatorSearchValue}
          locatorSearchValue={locatorSearchValue}
          setLocatorSearchStrategy={setLocatorSearchStrategy}
          locatorSearchStrategy={locatorSearchStrategy}
          automationName={featureCaps.automationName}
          currentContext={currentContext}
          searchHistory={searchHistory}
          showSearchHistory={showSearchHistory}
          extraLocators={extraLocators}
          addLocator={addLocator}
          updateLocator={updateLocator}
          removeLocator={removeLocator}
          groupMode={groupMode}
          setGroupMode={setGroupMode}
          isSearchingForElements={isSearchingForElements}
        />
      )}
      {locatedElements && (
        <>
          {locatedElements.length === 0 && grouped && <i>{t('couldNotFindAnyElements')}</i>}
          {locatedElements.length === 0 && !grouped && (
            <LocatorSearchEmptyResults
              locatorSearchStrategy={locatorSearchStrategy}
              locatorSearchValue={locatorSearchValue}
              automationName={featureCaps.automationName}
              sessionSettings={sessionSettings}
            />
          )}
          {locatedElements.length > 0 && <LocatorSearchFoundResults {...props} grouped={grouped} />}
        </>
      )}
    </Modal>
  );
};

export default LocatorSearchModal;
