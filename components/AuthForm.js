import { useState, useRef, useContext } from 'react';
import { InputWithFix } from './Form';
import { AsYouType, parsePhoneNumberFromString, isValidNumber } from 'libphonenumber-js';
import flag from 'country-code-emoji';
import Link from 'next/link';
import { LanguageContext } from './LanguageSelector';
import authContent from '../content/authForm';

export default function AuthForm({ children }) {
  const { language } = useContext(LanguageContext);

  const codeInputRef = useRef({});
  const submitBtnRef = useRef(null);

  const [phoneError, setPhoneError] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [countryCode, setCountryCode] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);

  const asYouTypeParser = new AsYouType();
  const codeIsComplete = code.length === 6;
  const phoneIsValid = phone && isValidNumber(phone);
  const parsedPhone = parsePhoneNumberFromString(phone);
  const error = phoneError || (phone.length && !focused && (!parsedPhone || !parsedPhone.country || !phoneIsValid));

  const content = authContent[language];

  return (
    <form className="sm:mx-auto sm:w-full max-w-sm sm:px-8 sm:shadow-lg sm:border sm:border-gray-100 sm:rounded-lg sm:py-8 sm:mb-4 mt-4 lg:-mt-4">
      <div className="w-full">
        <label className="block text-sm font-medium leading-5 text-gray-700">
          {content.phone.label}
          <span className="block text-gray-500 font-normal text-xs">{content.phone.description}</span>
          <div className="-mt-px flex">
            <InputWithFix
              suffix={
                phoneIsValid && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    class="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )
              }
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              prefix={parsedPhone && parsedPhone.country ? flag(parsedPhone.country) : '🌍'}
              type="phone"
              value={asYouTypeParser.input(phone)}
              onChange={({ value }) => {
                phoneError && setPhoneError(false);
                setPhone(value);
                if (isValidNumber(value)) {
                  codeInputRef.current[0].focus();
                }
              }}
              placeholder="+45 60 55 07 09"
            />
            <span className="inline-flex rounded-md shadow-sm">
              <button
                onClick={e => {
                  e.preventDefault();
                  if (!phone || !isValidNumber(phone)) {
                    setPhoneError(content.phone.error.incomplete);
                  }
                }}
                className={
                  'w-full inline-flex justify-center py-2 px-4 mt-1 ml-2 border border-gray-300 rounded-md bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition duration-150 ease-in-out'
                }>
                {content.phone.btn.send} <span className="hidden sm:inline-block ml-1">{content.phone.btn.code}</span>
              </button>
            </span>
          </div>
          {!!error && (
            <p class="mt-2 text-xs font-normal text-red-600">
              {phoneError ||
                (!parsedPhone || !parsedPhone.country
                  ? content.phone.error.missingCountryCode
                  : content.phone.error.invalid)}
            </p>
          )}
        </label>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium leading-5 text-gray-700 mb-1">
          {content.code.label}
          <span className="block text-gray-500 font-normal text-xs">{content.code.description}</span>
        </label>
        <div className="-mt-px flex">
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <div key={idx} className="-ml-px flex-1 min-w-0 z-30">
              <input
                maxLength="1"
                onChange={e => {
                  const value = e.target.value;
                  setCode(
                    [...code]
                      .filter((val, index) => index < idx)
                      .concat(value)
                      .join('')
                  );
                  const nextField = codeInputRef.current[idx + 1];
                  idx !== 5 && nextField ? nextField.focus() : setTimeout(() => submitBtnRef.current.focus(), 100);
                }}
                value={[...code][idx] || ''}
                ref={input => (codeInputRef.current[idx] = input)}
                className={`form-input relative block w-full rounded-none ${
                  idx === 0 ? 'rounded-l-md ' : idx === 5 ? 'rounded-r-md ' : ''
                }bg-transparent transition text-center ease-in-out duration-150 sm:text-sm sm:leading-5 px-0 sm:px-auto`}
                placeholder="0"
              />
            </div>
          ))}
          <div className="relative flex items-center justify-center text-sm leading-5 ml-2">
            <button
              disabled={!code.length}
              onClick={e => {
                e.preventDefault();
                setCode('');
                codeInputRef.current[0].focus();
              }}
              className={'text-sm ' + !!code.length ? 'text-blue-500' : 'text-gray-500'}>
              {content.code.reset}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <span className="block w-full rounded-md shadow-sm">
          <button
            disabled={!(codeIsComplete && phoneIsValid)}
            ref={btn => (submitBtnRef.current = btn)}
            onClick={async () => {
              const response = await fetch('/api/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: {
                  phone,
                  code,
                },
              });
              if (response.ok) {
                // authorization as a cookie?
                // do something (save in localStorage and redirect)
              } else {
                setAuthError(content.btn.error);
              }
            }}
            className={
              'w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none transition duration-150 ease-in-out ' +
              (phoneIsValid && codeIsComplete
                ? 'bg-indigo-600 hover:bg-indigo-500 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700'
                : 'bg-gray-500 focus:shadow-outline-gray cursor-default')
            }>
            {content.btn.label}
          </button>
        </span>
        {authError && <p class="mt-2 text-xs font-normal text-red-600">{authError}</p>}
      </div>
      <p className="mt-3 text-sm leading-5 text-gray-500">
        {content.privacy.prefix}
        <Link href="#">
          <a className="font-medium text-gray-900 underline ml-1">{content.privacy.label}</a>
        </Link>
      </p>
    </form>
  );
}
