document.addEventListener('DOMContentLoaded', function() {
    // Get all input elements
    const inputs = {
        freeCashFlow: document.getElementById('freeCashFlow'),
        terminalGrowthRate: document.getElementById('terminalGrowthRate'),
        discountRate: document.getElementById('discountRate'),
        growthRate: document.getElementById('growthRate'),
        sharesOutstanding: document.getElementById('sharesOutstanding'),
        stockTicker: document.getElementById('stockTicker')
    };

    // Get all output elements
    const outputs = {
        currentPrice: document.getElementById('currentPrice'),
        intrinsicValue: document.getElementById('intrinsicValue'),
        impliedGrowth: document.getElementById('impliedGrowth'),
        valuationMarker: document.getElementById('valuationMarker')
    };

    // Add event listeners to all inputs
    Object.values(inputs).forEach(input => {
        input.addEventListener('change', calculateDCF);
    });

    function calculateDCF() {
        const fcf = parseFloat(inputs.freeCashFlow.value);
        const terminalGrowth = parseFloat(inputs.terminalGrowthRate.value);
        const discount = parseFloat(inputs.discountRate.value);
        const growth = parseFloat(inputs.growthRate.value) / 100;
        const sharesOutstanding = parseFloat(inputs.sharesOutstanding.value);
        const currentPrice = parseFloat(outputs.currentPrice.value);

        // Calculate present value of future cash flows with user-defined growth rate
        let presentValue = 0;
        let currentFcf = fcf;

        // Calculate for 10 years
        for (let i = 1; i <= 10; i++) {
            currentFcf *= (1 + growth);
            presentValue += currentFcf / Math.pow(1 + discount, i);
        }

        // Terminal value calculation
        const terminalValue = (currentFcf * (1 + terminalGrowth)) / 
                            (discount - terminalGrowth);
        const presentTerminalValue = terminalValue / Math.pow(1 + discount, 10);

        // Total value
        const totalValue = presentValue + presentTerminalValue;
        const valuePerShare = totalValue / sharesOutstanding;

        // Update intrinsic value display
        outputs.intrinsicValue.textContent = `$${valuePerShare.toFixed(2)}`;
        
        // Calculate implied growth rate based on current share price
        let impliedGrowth = growth; // Start with input growth as default
        
        if (!isNaN(currentPrice) && currentPrice > 0 && !isNaN(fcf) && fcf > 0 && !isNaN(sharesOutstanding) && sharesOutstanding > 0) {
            // Binary search to find the implied growth rate
            let low = -0.2; // -20%
            let high = 0.5; // 50%
            let mid = 0;
            let estimatedValue = 0;
            
            // Perform binary search to find growth rate that matches current price
            for (let i = 0; i < 20; i++) { // 20 iterations should be enough for precision
                mid = (low + high) / 2;
                
                // Calculate DCF with this trial growth rate
                let trialFcf = fcf;
                let trialPV = 0;
                
                for (let j = 1; j <= 10; j++) {
                    trialFcf *= (1 + mid);
                    trialPV += trialFcf / Math.pow(1 + discount, j);
                }
                
                // Terminal value
                let trialTerminal = (trialFcf * (1 + terminalGrowth)) / (discount - terminalGrowth);
                let trialTerminalPV = trialTerminal / Math.pow(1 + discount, 10);
                
                // Total value per share
                estimatedValue = (trialPV + trialTerminalPV) / sharesOutstanding;
                
                // Adjust search range
                if (Math.abs(estimatedValue - currentPrice) < 0.01) {
                    break; // Close enough to the target price
                } else if (estimatedValue < currentPrice) {
                    low = mid; // Growth rate is too low
                } else {
                    high = mid; // Growth rate is too high
                }
            }
            
            impliedGrowth = mid;
        }
        
        // Update implied growth rate display
        outputs.impliedGrowth.textContent = `${(impliedGrowth * 100).toFixed(1)}%`;

        // Update valuation marker
        const ratio = valuePerShare / currentPrice;
        let markerPosition = 50; // Default to middle

        if (ratio < 0.8) markerPosition = 20; // Overvalued (intrinsic value < current price)
        else if (ratio > 1.2) markerPosition = 80; // Undervalued (intrinsic value > current price)

        outputs.valuationMarker.style.left = `${markerPosition}%`;
        // Add glow based on position
        if (markerPosition < 40) {
            outputs.valuationMarker.style.boxShadow = "0 0 8px #ff0055";
        } else if (markerPosition > 60) {
            outputs.valuationMarker.style.boxShadow = "0 0 8px #00ff00";
        } else {
            outputs.valuationMarker.style.boxShadow = "0 0 8px #ffffff";
        }
    }

    // Initial calculation
    calculateDCF();

    // Add event listener for current price changes
    outputs.currentPrice.addEventListener('change', calculateDCF);

    // Summary Modal functionality
    const modal = document.getElementById('summaryModal');
    const summaryBtn = document.getElementById('generateSummary');
    const closeBtn = document.querySelector('.close-button');
    const downloadBtn = document.getElementById('downloadSummary');

    // Open modal when Generate Summary is clicked
    summaryBtn.addEventListener('click', function() {
        updateSummary();
        modal.style.display = 'block';
    });

    // Close modal when X is clicked
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside the modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Update summary content with current values
    function updateSummary() {
        // Get current date
        const today = new Date();
        const dateStr = today.toLocaleDateString();
        
        // Update summary fields
        document.getElementById('summaryTicker').textContent = inputs.stockTicker.value || 'TKR';
        document.getElementById('summaryDate').textContent = `Date: ${dateStr}`;
        document.getElementById('summaryFCF').textContent = inputs.freeCashFlow.value || '-';
        
        // Get selected text from dropdowns
        const terminalGrowthSelect = inputs.terminalGrowthRate;
        const terminalGrowthText = terminalGrowthSelect.options[terminalGrowthSelect.selectedIndex].text;
        document.getElementById('summaryTerminalGrowth').textContent = terminalGrowthText;
        
        const discountRateSelect = inputs.discountRate;
        const discountRateText = discountRateSelect.options[discountRateSelect.selectedIndex].text;
        document.getElementById('summaryDiscountRate').textContent = discountRateText;
        
        document.getElementById('summaryGrowthRate').textContent = `${inputs.growthRate.value || '-'}%`;
        document.getElementById('summaryShares').textContent = inputs.sharesOutstanding.value || '-';
        
        // Results
        document.getElementById('summaryCurrentPrice').textContent = `$${outputs.currentPrice.value || '-'}`;
        document.getElementById('summaryIntrinsicValue').textContent = outputs.intrinsicValue.textContent;
        document.getElementById('summaryImpliedGrowth').textContent = outputs.impliedGrowth.textContent;
        
        // Determine valuation status
        let valuationStatus = 'Fairly Valued';
        const currentPrice = parseFloat(outputs.currentPrice.value);
        const intrinsicValue = parseFloat(outputs.intrinsicValue.textContent.replace('$', ''));
        
        if (!isNaN(currentPrice) && !isNaN(intrinsicValue)) {
            const ratio = intrinsicValue / currentPrice;
            if (ratio < 0.8) {
                valuationStatus = 'Overvalued (Too Optimistic)';
            } else if (ratio > 1.2) {
                valuationStatus = 'Undervalued (Too Pessimistic)';
            }
        }
        
        document.getElementById('summaryValuation').textContent = valuationStatus;
    }

    // Download summary as image
    downloadBtn.addEventListener('click', function() {
        const summaryElement = document.querySelector('.summary-container');
        
        html2canvas(summaryElement).then(canvas => {
            const link = document.createElement('a');
            link.download = `${inputs.stockTicker.value || 'Stock'}_DCF_Analysis.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });
}); 