import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate, parseDate } from '../../utils/format';

/**
 * Custom DateInput component that supports dd/mm/yyyy format
 * @param {string} value - ISO date string (yyyy-mm-dd)
 * @param {function} onChange - Callback function when date changes
 * @param {string} name - Input name
 * @param {string} placeholder - Input placeholder
 * @param {string} className - Additional CSS classes
 * @param {boolean} error - Error state
 */
export const DateInput = forwardRef(({
  value,
  onChange,
  name,
  placeholder = 'dd/mm/yyyy',
  className = '',
  error = false,
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const dateInputRef = useRef(null);

  // Sync internal input value with external prop value
  useEffect(() => {
    if (value) {
      setInputValue(formatDate(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = useCallback((e) => {
    let input = e.target.value;
    const isDeleting = e.nativeEvent.inputType === 'deleteContentBackward';
    
    // Lấy chuỗi số thuần túy
    let digits = input.replace(/\D/g, '').substring(0, 8);
    
    // Nếu đang xóa và vừa xóa một dấu gạch chéo, xóa luôn số đứng trước nó
    if (isDeleting && (input.endsWith('/') || (input.length === 2 || input.length === 5))) {
        // digits = digits.substring(0, digits.length); // digits đã được làm sạch rồi
    }

    let formatted = '';
    if (digits.length > 0) {
        // NGÀY
        let d = digits.substring(0, 2);
        if (d.length === 1 && parseInt(d) > 3) d = '0' + d;
        if (d.length === 2) {
            let dayNum = parseInt(d);
            if (dayNum > 31) d = '31';
            else if (dayNum === 0) d = '01';
        }
        formatted += d;

        if (digits.length > 2 || (d.length === 2 && !isDeleting)) {
            formatted += '/';
            // THÁNG
            let m = digits.substring(2, 4);
            if (m.length === 1 && parseInt(m) > 1) m = '0' + m;
            if (m.length === 2) {
                let monthNum = parseInt(m);
                if (monthNum > 12) m = '12';
                else if (monthNum === 0) m = '01';
            }
            formatted += m;

            if (digits.length > 4 || (m.length === 2 && !isDeleting)) {
                formatted += '/';
                // NĂM
                let y = digits.substring(4, 8);
                formatted += y;
            }
        }
    }

    setInputValue(formatted);
    
    // Gửi giá trị lên cha khi đủ 8 số (định dạng dd/mm/yyyy đầy đủ)
    if (digits.length === 8) {
        const isoDate = parseDate(formatted);
        if (isoDate) {
          onChange({ target: { name, value: isoDate, type: 'text' } });
        }
    }
  }, [name, onChange]);

  const handleBlur = useCallback(() => {
    // Attempt final parse on blur
    if (!inputValue) {
        onChange({ target: { name, value: '', type: 'text' } });
        return;
    }
    
    const isoDate = parseDate(inputValue);
    if (isoDate) {
      onChange({ target: { name, value: isoDate, type: 'text' } });
    } else if (!value) {
      setInputValue('');
    } else {
      // If invalid, reset to last valid value
      setInputValue(formatDate(value));
    }
  }, [inputValue, name, onChange, value]);

  const handleIconClick = useCallback(() => {
    // Programmatically open the native date picker
    if (dateInputRef.current) {
        if (typeof dateInputRef.current.showPicker === 'function') {
            dateInputRef.current.showPicker();
        } else {
            // Fallback for older browsers
            dateInputRef.current.focus();
            dateInputRef.current.click();
        }
    }
  }, []);

  const handleNativeChange = useCallback((e) => {
    const isoDate = e.target.value;
    if (isoDate) {
      onChange({ target: { name, value: isoDate, type: 'text' } });
      setInputValue(formatDate(isoDate));
    }
  }, [name, onChange]);

  return (
    <div className="relative w-full group">
      <input
        ref={ref}
        type="text"
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
        } ${className}`}
        {...props}
      />
      
      {/* Hidden native Date Picker used for the calendar selection icon */}
      <input
        ref={dateInputRef}
        type="date"
        className="invisible absolute left-0 bottom-0 w-0 h-0"
        tabIndex="-1"
        onChange={handleNativeChange}
        value={value || ''}
      />

      <button
        type="button"
        onClick={handleIconClick}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
      >
        <Calendar className="w-5 h-5" />
      </button>
    </div>
  );
});

DateInput.displayName = 'DateInput';
export default DateInput;
